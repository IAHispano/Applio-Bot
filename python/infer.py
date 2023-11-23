import os
import sys
import wget
import torch
import gdown
import zipfile
import warnings
import requests
import traceback
import numpy as np
import soundfile as sf
from config import Config
from bs4 import BeautifulSoup
from vc_infer_pipeline import VC
from fairseq import checkpoint_utils
from infer_pack.models import (
    SynthesizerTrnMs256NSFsid,
    SynthesizerTrnMs256NSFsid_nono,
    SynthesizerTrnMs768NSFsid,
    SynthesizerTrnMs768NSFsid_nono,
)
from infer_pack.utils import load_audio

warnings.filterwarnings("ignore")
torch.manual_seed(114514)

config = Config()
hubert_model = None


def find_folder_parent(search_dir, folder_name):
    for dirpath, dirnames, filenames in os.walk(search_dir):
        if folder_name in dirnames:
            return os.path.abspath(dirpath)
    return None


now_dir = os.getcwd()
file_path = find_folder_parent(now_dir, "models")

zips_path = os.getcwd() + "/zips"

if not os.path.exists("./hubert_base.pt"):
    wget.download(
        "https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/hubert_base.pt",
        out="./hubert_base.pt",
    )

if not os.path.exists("./rmvpe.pt"):
    wget.download(
        "https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/rmvpe.pt",
        out="./rmvpe.pt",
    )

if not os.path.exists("./ffmpeg.exe"):
    wget.download(
        "https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/ffmpeg.exe",
        out="./ffmpeg.exe",
    )

if not os.path.exists("./ffprobe.exe"):
    wget.download(
        "https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/ffprobe.exe",
        out="./ffprobe.exe",
    )


def search_pth_index(folder):
    pth_paths = [
        os.path.join(folder, file)
        for file in os.listdir(folder)
        if os.path.isfile(os.path.join(folder, file)) and file.endswith(".pth")
    ]
    index_paths = [
        os.path.join(folder, file)
        for file in os.listdir(folder)
        if os.path.isfile(os.path.join(folder, file)) and file.endswith(".index")
    ]

    return pth_paths, index_paths


def get_mediafire_download_link(url):
    response = requests.get(url)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    download_button = soup.find(
        "a", {"class": "input popsok", "aria-label": "Download file"}
    )
    if download_button:
        download_link = download_button.get("href")
        return download_link
    else:
        return None


def download_from_url(url):
    os.makedirs(zips_path, exist_ok=True)
    if url != "":
        if "drive.google.com" in url:
            if "file/d/" in url:
                file_id = url.split("file/d/")[1].split("/")[0]
            elif "id=" in url:
                file_id = url.split("id=")[1].split("&")[0]
            else:
                return None

            if file_id:
                os.chdir(zips_path)
                try:
                    gdown.download(
                        f"https://drive.google.com/uc?id={file_id}",
                        quiet=False,
                        fuzzy=True,
                    )
                except Exception as e:
                    error_message = str(e)
                    if (
                        "Too many users have viewed or downloaded this file recently"
                        in error_message
                    ):
                        os.chdir(now_dir)
                        return "too much use"
                    elif (
                        "Cannot retrieve the public link of the file." in error_message
                    ):
                        os.chdir(now_dir)
                        return "private link"
                    else:
                        print(error_message)
                        os.chdir(now_dir)
                        return None

        elif "/blob/" in url or "/resolve/" in url:
            os.chdir(zips_path)
            if "/blob/" in url:
                url = url.replace("/blob/", "/resolve/")

            response = requests.get(url, stream=True)
            if response.status_code == 200:
                file_name = url.split("/")[-1]
                file_name = file_name.replace("%20", "_")
                total_size_in_bytes = int(response.headers.get("content-length", 0))
                block_size = 1024
                progress_bar_length = 50
                progress = 0
                with open(os.path.join(zips_path, file_name), "wb") as file:
                    for data in response.iter_content(block_size):
                        file.write(data)
                        progress += len(data)
                        progress_percent = int((progress / total_size_in_bytes) * 100)
                        num_dots = int(
                            (progress / total_size_in_bytes) * progress_bar_length
                        )
                        progress_bar = (
                            "["
                            + "." * num_dots
                            + " " * (progress_bar_length - num_dots)
                            + "]"
                        )
                        print(
                            f"{progress_percent}% {progress_bar} {progress}/{total_size_in_bytes}  ",
                            end="\r",
                        )
                        if progress_percent == 100:
                            print("\n")

            else:
                os.chdir(now_dir)
                return None
        elif "/tree/main" in url:
            os.chdir(zips_path)
            response = requests.get(url)
            soup = BeautifulSoup(response.content, "html.parser")
            temp_url = ""
            for link in soup.find_all("a", href=True):
                if link["href"].endswith(".zip"):
                    temp_url = link["href"]
                    break
            if temp_url:
                url = temp_url
                url = url.replace("blob", "resolve")
                if "huggingface.co" not in url:
                    url = "https://huggingface.co" + url

                    wget.download(url)
            else:
                os.chdir(now_dir)
                return None
        else:
            try:
                os.chdir(zips_path)
                wget.download(url)
            except Exception as e:
                os.chdir(now_dir)
                print(e)
                return None

        for currentPath, _, zipFiles in os.walk(zips_path):
            for Files in zipFiles:
                filePart = Files.split(".")
                extensionFile = filePart[len(filePart) - 1]
                filePart.pop()
                nameFile = "_".join(filePart)
                realPath = os.path.join(currentPath, Files)
                os.rename(realPath, nameFile + "." + extensionFile)

    os.chdir(now_dir)
    return "downloaded"


def unzip_file(zip_path, zip_file_name):
    zip_file_path = os.path.join(zip_path, zip_file_name + ".zip")
    extract_path = os.path.join(file_path, "models", zip_file_name)
    with zipfile.ZipFile(zip_file_path, "r") as zip_ref:
        zip_ref.extractall(extract_path)
    os.remove(zip_file_path)


url = sys.argv[4]
verify = download_from_url(url)

if verify == "downloaded":
    file_name = os.path.splitext(os.path.basename(url))[0]

    extract_folder_path = os.path.join(file_path, "models", file_name)
    os.makedirs(extract_folder_path, exist_ok=True)
    zip_file_path = os.path.join(zips_path, file_name + ".zip")

    if not os.path.exists(zip_file_path):
        sys.exit()
    unzip_file(zips_path, file_name)

    result = search_pth_index(os.path.join(file_path, "models", file_name))
else:
    message = "Error"
    sys.exit()


def load_hubert():
    global hubert_model
    models, _, _ = checkpoint_utils.load_model_ensemble_and_task(
        ["hubert_base.pt"],
        suffix="",
    )
    hubert_model = models[0]
    hubert_model = hubert_model.to(config.device)
    if config.is_half:
        hubert_model = hubert_model.half()
    else:
        hubert_model = hubert_model.float()
    hubert_model.eval()


def vc_single(
    sid=0,
    input_audio_path=None,
    f0_up_key=None,
    f0_file=None,
    f0_method=None,
    file_index=None,
    index_rate=None,
    resample_sr=0,
    rms_mix_rate=1,
    protect=0.33,
    crepe_hop_length=None,
    output_path=None,
):
    global tgt_sr, net_g, vc, hubert_model, version

    filter_radius = 3
    if input_audio_path is None:
        return "Please, load an audio!", None

    f0_up_key = int(f0_up_key)
    try:
        audio = load_audio(input_audio_path, 16000)
        print("Trying to load", input_audio_path)
        audio_max = np.abs(audio).max() / 0.95

        if audio_max > 1:
            audio /= audio_max

        times = [0, 0, 0]
        if not hubert_model:
            load_hubert()
        if_f0 = cpt.get("f0", 1)

        file_index = (
            file_index.strip(" ")
            .strip('"')
            .strip("\n")
            .strip('"')
            .strip(" ")
            .replace("trained", "added")
        )
        if tgt_sr != resample_sr >= 16000:
            tgt_sr = resample_sr

        audio_opt = vc.pipeline(
            hubert_model,
            net_g,
            sid,
            audio,
            input_audio_path,
            times,
            f0_up_key,
            f0_method,
            file_index,
            index_rate,
            if_f0,
            filter_radius,
            tgt_sr,
            resample_sr,
            rms_mix_rate,
            version,
            protect,
            crepe_hop_length,
            f0_file=f0_file,
        )

        print("Time: ", times[2], sep="")

        if output_path is not None:
            sf.write(output_path, audio_opt, tgt_sr, format="WAV")

        return "Done", (tgt_sr, audio_opt)

    except:
        info = traceback.format_exc()
        print(info)
        return info, (None, None)


def vc_multi(
    sid,
    dir_path,
    opt_root,
    paths,
    f0_up_key,
    f0_method,
    file_index,
    file_index2,
    index_rate,
    filter_radius,
    resample_sr,
    rms_mix_rate,
    protect,
    format1,
    crepe_hop_length,
):
    try:
        dir_path = dir_path.strip(" ").strip('"').strip("\n").strip('"').strip(" ")
        opt_root = opt_root.strip(" ").strip('"').strip("\n").strip('"').strip(" ")
        os.makedirs(opt_root, exist_ok=True)
        try:
            if dir_path != "":
                paths = [os.path.join(dir_path, name) for name in os.listdir(dir_path)]
            else:
                paths = [path.name for path in paths]
        except:
            traceback.print_exc()
            paths = [path.name for path in paths]
        infos = []
        for path in paths:
            info, opt = vc_single(
                sid,
                path,
                f0_up_key,
                None,
                f0_method,
                file_index,
                file_index2,
                index_rate,
                filter_radius,
                resample_sr,
                rms_mix_rate,
                protect,
                crepe_hop_length,
            )
            if "success" in info:
                try:
                    tgt_sr, audio_opt = opt
                    if format1 in ["wav", "flac"]:
                        sf.write(
                            "%s/%s.%s" % (opt_root, os.path.basename(path), format1),
                            audio_opt,
                            tgt_sr,
                        )
                    else:
                        path = "%s/%s.wav" % (opt_root, os.path.basename(path))
                        sf.write(
                            path,
                            audio_opt,
                            tgt_sr,
                        )
                        if os.path.exists(path):
                            os.system(
                                "ffmpeg -i %s -vn %s -q:a 2 -y"
                                % (path, path[:-4] + ".%s" % format1)
                            )
                except:
                    info += traceback.format_exc()
            infos.append("%s->%s" % (os.path.basename(path), info))
            yield "\n".join(infos)
        yield "\n".join(infos)
    except:
        yield traceback.format_exc()


def get_vc(weight_root, sid):
    global n_spk, tgt_sr, net_g, vc, cpt, version
    if sid == "" or sid == []:
        global hubert_model
        if hubert_model is not None:
            print("clean_empty_cache")
            del net_g, n_spk, vc, hubert_model, tgt_sr  # ,cpt
            hubert_model = net_g = n_spk = vc = hubert_model = tgt_sr = None
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

            if_f0 = cpt.get("f0", 1)
            version = cpt.get("version", "v1")
            if version == "v1":
                if if_f0 == 1:
                    net_g = SynthesizerTrnMs256NSFsid(
                        *cpt["config"], is_half=config.is_half
                    )
                else:
                    net_g = SynthesizerTrnMs256NSFsid_nono(*cpt["config"])
            elif version == "v2":
                if if_f0 == 1:
                    net_g = SynthesizerTrnMs768NSFsid(
                        *cpt["config"], is_half=config.is_half
                    )
                else:
                    net_g = SynthesizerTrnMs768NSFsid_nono(*cpt["config"])
            del net_g, cpt
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            cpt = None
        return {"visible": False, "__type__": "update"}
    person = weight_root
    cpt = torch.load(person, map_location="cpu")
    tgt_sr = cpt["config"][-1]
    cpt["config"][-3] = cpt["weight"]["emb_g.weight"].shape[0]
    if_f0 = cpt.get("f0", 1)

    version = cpt.get("version", "v1")
    if version == "v1":
        if if_f0 == 1:
            net_g = SynthesizerTrnMs256NSFsid(*cpt["config"], is_half=config.is_half)
        else:
            net_g = SynthesizerTrnMs256NSFsid_nono(*cpt["config"])
    elif version == "v2":
        if if_f0 == 1:
            net_g = SynthesizerTrnMs768NSFsid(*cpt["config"], is_half=config.is_half)
        else:
            net_g = SynthesizerTrnMs768NSFsid_nono(*cpt["config"])
    del net_g.enc_q
    print(net_g.load_state_dict(cpt["weight"], strict=False))
    net_g.eval().to(config.device)
    if config.is_half:
        net_g = net_g.half()
    else:
        net_g = net_g.float()
    vc = VC(tgt_sr, config)
    n_spk = cpt["config"][-3]


f0up_key = sys.argv[1]
input_path = sys.argv[2]
opt_path = sys.argv[3]
index_rate = float(0.66)
f0method = "rmvpe"


model_path = result[0][0]
index_path = result[1][0]

sid = f0up_key
input_audio = input_path
f0_pitch = 0
crepe_hop_length = 64
f0_file = None
f0_method = f0method
file_index = index_path
index_rate = index_rate
output_file = opt_path

get_vc(model_path, 0)


try:
    result, audio_opt = vc_single(
        sid=0,
        input_audio_path=input_audio,
        f0_up_key=f0_pitch,
        f0_file=None,
        f0_method=f0_method,
        file_index=file_index,
        index_rate=index_rate,
        crepe_hop_length=crepe_hop_length,
        output_path=output_file,
    )

    if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
        message = result
    else:
        message = result

    print(message)

except Exception as error:
    message = "Voice conversion failed", error
    print(message)
