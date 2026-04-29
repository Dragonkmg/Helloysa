const produtos = [
    { 
        id: 1, 
        nome: "Saia Floral", 
        preco: 89.90,
        precoPromo: 50.00,
        imagens: ["gato.png", "bckg.jpg", "RobloxScreenShot20260101_172202518.png"], // Lista de imagens
        tags: ["Promoção", "Novo"],
        rating: 5 
    },
    { 
        id: 2, 
        nome: "Calça Floral", 
        preco: 100.99,
        precoPromo: 75.99,
        imagens: ["gato.png", "bckg.jpg", "RobloxScreenShot20260101_172202518.png"], // Lista de imagens
        tags: ["Promoção", "Black-Friday"],
        rating: 5 
    },
    { 
        id: 3, 
        nome: "Vestido Bye-Kitty", 
        preco: 250.99,
        precoPromo: 150.99,
        imagens: ["gato.png", "bckg.jpg", "RobloxScreenShot20260101_172202518.png"], // Lista de imagens
        tags: ["Promoção", "Black-Friday"],
        rating: 5 
    }
];

const container = document.getElementById('produtos-container');

produtos.forEach(produto => {
    // Avaliações (Mantido)
    let estrelas = '';
    for (let i = 0; i < 5; i++) {
        estrelas += i < produto.rating ? '<div class="bi-star-fill"></div>' : '<div class="bi-star"></div>';
    }

    const cardHTML = `
        <div class="col mb-5">
            <div class="card h-100 overflow-hidden"> 
                <div class="img-zoom-container position-relative overflow-hidden">
                    <img id="img-main-${produto.id}" 
                         class="card-img-top img-zoom-element" 
                         src="assets/img/${produto.imagens[0]}" 
                         alt="${produto.nome}" />

                    <div class="carousel-nav-overlay position-absolute d-flex justify-content-between w-100 px-2" style="top: 50%; transform: translateY(-50%); z-index: 10;">
                        <button class="btn btn-dark btn-sm rounded-circle" onclick="alterarImagem(${produto.id}, -1)">
                            <i class="bi-chevron-left"></i>
                        </button>
                        <button class="btn btn-dark btn-sm rounded-circle" onclick="alterarImagem(${produto.id}, 1)">
                            <i class="bi-chevron-right"></i>
                        </button>
                    </div>

                    <div id="tag-${produto.id}" class="badge bg-dark text-white position-absolute" style="top: 0.5rem; right: 0.5rem; transition: opacity 0.5s; z-index: 11;">
                        ${produto.tags[0] || ''}
                    </div>
                </div>

                <div class="card-body p-4">
                    <div class="text-center">
                        <h5 class="fw-bolder">${produto.nome}</h5>
                        <div class="d-flex justify-content-center small text-warning mb-2">${estrelas}</div>
                        
                        ${produto.precoPromo 
                            ? `<span class="text-muted text-decoration-line-through me-1">R$ ${produto.preco.toFixed(2)}</span>
                               <span class="fw-bold text-danger">R$ ${produto.precoPromo.toFixed(2)}</span>`
                            : `<span>R$ ${produto.preco.toFixed(2)}</span>`
                        }
                    </div>
                </div>
                
                <div class="card-footer p-4 pt-0 border-top-0 bg-transparent">
                    <div class="text-center"><a class="btn btn-outline-dark mt-auto" href="#">Adicionar</a></div>
                </div>
            </div>
        </div>
    `;
    container.innerHTML += cardHTML;
});

// Lógica de Rotatividade das Imagens
function alterarImagem(produtoId, direcao) {
    // Busca o produto correspondente na lista
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;

    const imgElement = document.getElementById(`img-main-${produtoId}`);
    
    // Extrai o nome da imagem atual do atributo src
    const currentSrc = imgElement.getAttribute('src').split('/').pop();
    
    // Calcula o próximo índice
    let currentIndex = produto.imagens.indexOf(currentSrc);
    let nextIndex = (currentIndex + direcao + produto.imagens.length) % produto.imagens.length;
    
    // Atualiza a imagem no DOM
    imgElement.setAttribute('src', `assets/img/${produto.imagens[nextIndex]}`);
}

function rotacionarTags() {
    produtos.forEach(produto => {
        if (produto.tags.length > 1) {
            const tagElement = document.getElementById(`tag-${produto.id}`);
            
            // Encontra o índice atual e calcula o próximo
            let currentIndex = produto.tags.indexOf(tagElement.innerText);
            let nextIndex = (currentIndex + 1) % produto.tags.length;
            
            // Efeito visual simples de troca
            tagElement.style.opacity = 0;
            setTimeout(() => {
                tagElement.innerText = produto.tags[nextIndex];
                tagElement.style.opacity = 1;
            }, 500);
        }
    });
}

setInterval(rotacionarTags, 3000);