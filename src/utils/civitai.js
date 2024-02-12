const axios = require('axios');

async function fetchModels({
    limit = null,
    page = null,
    query = null,
    tag = null,
    username = null,
    types = null,
    sort = null,
    period = null,
    rating = null,
    favorites = null,
    hidden = null,
    primaryFileOnly = null,
    allowNoCredit = null,
    allowDerivatives = null,
    allowDifferentLicenses = null,
    allowCommercialUse = null,
    nsfw = null
} = {}) {
    const endpointUrl = "https://civitai.com/api/v1/models";

    // Filtrar valores nulos
    const params = Object.fromEntries(
        Object.entries({
            limit,
            page,
            query,
            tag,
            username,
            types,
            sort,
            period,
            rating,
            favorites,
            hidden,
            primaryFileOnly,
            allowNoCredit,
            allowDerivatives,
            allowDifferentLicenses,
            allowCommercialUse,
            nsfw
        }).filter(([key, value]) => value !== null)
    );

    try {
        const response = await axios.get(endpointUrl, { params });
        return response.data;
    } catch (error) {
        console.error("Error en la solicitud HTTP:", error.message);
        return null;
    }
}

module.exports = { fetchModels };