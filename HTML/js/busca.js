export async function buscarProdutos({ busca = "", tag = "" } = {}) {
    const params = new URLSearchParams();

    if (busca) {
        params.append("busca", busca);
    }

    if (tag) {
        params.append("tag", tag);
    }

    const res = await fetch(`/produtos?${params.toString()}`);

    if (!res.ok) {
        throw new Error("Erro ao buscar produtos.");
    }

    return await res.json();
}