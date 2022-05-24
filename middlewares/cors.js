function cors(req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'POST');

    const {method} = req;
    if (method === "OPTIONS") {
        return res.status(204).end();
    } else if (method !== "POST") {
        return res.status(405).end();
    }
    

    return next();
}

module.exports = cors;