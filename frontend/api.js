const API_URL = "http://localhost:3000/api";

async function apiGet(path) {
    const res = await fetch(API_URL + path);
    return await res.json();
}

async function apiPost(path, data) {
    const res = await fetch(API_URL + path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    return await res.json();
}

async function apiPut(path, data) {
    const res = await fetch(API_URL + path, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    return await res.json();
}

async function apiDelete(path) {
    const res = await fetch(API_URL + path, {
        method: "DELETE"
    });

    return await res.json();
}