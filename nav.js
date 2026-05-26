import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAJTlL-4piG67VOM_y480dhyib2qaF3Bso",
  authDomain: "phenobrasil.firebaseapp.com",
  projectId: "phenobrasil",
  storageBucket: "phenobrasil.firebasestorage.app",
  messagingSenderId: "825755980394",
  appId: "1:825755980394:web:caad888821d128fb133013"
};

// Reutiliza app se já foi inicializado
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ── HTML DA NAV ──────────────────────────────────────────
export function renderNav(activeLink = '') {
  const links = [
    { label: 'Sobre',    href: '#' },
    { label: 'Breeders', href: 'breeders.html' },
    { label: 'Sementes', href: '#', dropdown: [
      { icon: '🌿', label: 'Breeders',         sub: 'Conheça quem cultiva',   href: 'breeders.html' },
      { icon: '🧬', label: 'Tipos de Sementes', sub: 'Fem, Auto, Regular...', href: '#' },
      { icon: '🔬', label: 'Canabinoides',      sub: 'THC, CBD e mais',       href: '#' },
    ]},
    { label: 'Contato',  href: "contato.html" },
  ];

  const navItems = links.map(l => {
    const isActive = activeLink === l.label ? 'active' : '';
    if (l.dropdown) {
      const items = l.dropdown.map(d =>
        `<a href="${d.href}">${d.icon} ${d.label}<span class="dropdown-sub">${d.sub}</span></a>`
      ).join('');
      return `<li><a href="${l.href}" class="${isActive}">${l.label} <span class="arrow">▼</span></a><div class="dropdown">${items}</div></li>`;
    }
    return `<li><a href="${l.href}" class="${isActive}">${l.label}</a></li>`;
  }).join('');

  document.body.insertAdjacentHTML('afterbegin', `
    <div class="topbar">
      <span>🌱 Sementes premium de coleção — Breeders brasileiros</span>
      <div id="auth-top-links"></div>
    </div>
    <nav>
      <div class="nav-logo" onclick="location.href='index.html'">
        <h2>PHENO<span style="color:var(--gold)">BRASIL</span></h2>
      </div>
      <ul class="nav-center">${navItems}</ul>
      <div class="nav-right" id="auth-nav-btn"></div>
    </nav>

    <!-- MODAL LOGIN -->
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal">
        <button class="modal-close" onclick="window.closeModal()">&times;</button>
        <h2>Efetuar <span style="color:var(--gold)">Login</span></h2>
        <form onsubmit="window.fazerLogin(event)">
          <div class="form-group"><label>E-mail</label><input type="email" id="email-login" placeholder="seu@email.com" required></div>
          <div class="form-group"><label>Senha</label><input type="password" id="pass-login" placeholder="••••••••" required></div>
          <button type="submit" class="form-submit">Entrar</button>
        </form>
      </div>
    </div>

    <!-- CARRINHO -->
    <div class="cart-backdrop" id="cart-backdrop" onclick="window.fecharCarrinho()"></div>
    <div class="cart-drawer" id="cart-drawer">
      <div class="cart-header">
        <h3>🛒 Seu Carrinho</h3>
        <button class="cart-close-btn" onclick="window.fecharCarrinho()">&times;</button>
      </div>
      <div class="cart-items" id="cart-items"></div>
      <div class="cart-footer" id="cart-footer" style="display:none">
        <div class="cart-total-row">
          <span class="cart-total-label">Total</span>
          <span class="cart-total-value" id="cart-total">R$ 0,00</span>
        </div>
        <button class="checkout-btn" onclick="window.finalizarPedido()">Finalizar Pedido</button>
        <button class="clear-cart-btn" onclick="window.limparCarrinho()">Esvaziar carrinho</button>
      </div>
    </div>
    <div class="toast" id="toast"></div>
  `);
}

// ── CARRINHO ─────────────────────────────────────────────
export function initCarrinho() {
  let carrinho = JSON.parse(localStorage.getItem('pheno_cart') || '[]');
  const salvar = () => localStorage.setItem('pheno_cart', JSON.stringify(carrinho));

  const toast = (msg) => {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  };

  const badge = () => {
    const total = carrinho.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.cart-badge').forEach(b => {
      b.textContent = total; b.classList.toggle('visible', total > 0);
    });
  };

  const render = () => {
    const container = document.getElementById('cart-items');
    const footer    = document.getElementById('cart-footer');
    if (!container) return;
    if (!carrinho.length) {
      container.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🌿</div><p>Carrinho vazio.<br>Adicione genéticas da vitrine!</p></div>`;
      footer.style.display = 'none'; return;
    }
    let total = 0; container.innerHTML = '';
    carrinho.forEach((item, idx) => {
      total += item.price * item.qty;
      const div = document.createElement('div'); div.className = 'cart-item';
      div.innerHTML = `
        <img class="cart-item-img" src="${item.image || ''}" alt="${item.name}">
        <div>
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-sub">${item.type}</div>
          <div class="cart-item-price">R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}</div>
        </div>
        <div class="cart-item-controls">
          <div class="qty-controls">
            <button class="qty-btn" onclick="window.mudarQty(${idx},-1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="window.mudarQty(${idx},1)">+</button>
          </div>
          <button class="remove-btn" onclick="window.removerItem(${idx})">remover</button>
        </div>`;
      container.appendChild(div);
    });
    document.getElementById('cart-total').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
    footer.style.display = 'block'; badge();
  };

  window.abrirCarrinho  = () => { render(); document.getElementById('cart-drawer').classList.add('open'); document.getElementById('cart-backdrop').classList.add('open'); };
  window.fecharCarrinho = () => { document.getElementById('cart-drawer').classList.remove('open'); document.getElementById('cart-backdrop').classList.remove('open'); };
  window.mudarQty = (idx, d) => { carrinho[idx].qty += d; if (carrinho[idx].qty <= 0) carrinho.splice(idx, 1); salvar(); badge(); render(); };
  window.removerItem = (idx) => { const n = carrinho[idx].name; carrinho.splice(idx, 1); salvar(); badge(); render(); toast(`${n} removido`); };
  window.limparCarrinho = () => { carrinho = []; salvar(); badge(); render(); };
  window.finalizarPedido = () => alert('Em breve: checkout!');

  window.adicionarAoCarrinho = (id, name, type, price, image) => {
    const idx = carrinho.findIndex(i => i.id === id);
    if (idx > -1) { carrinho[idx].qty++; toast(`+1 ${name} no carrinho`); }
    else { carrinho.push({ id, name, type, price, image, qty: 1 }); toast(`✅ ${name} adicionado!`); }
    salvar(); badge();
    const btn = document.querySelector(`[data-product-id="${id}"]`);
    if (btn) { btn.textContent = '✓ Adicionado'; btn.classList.add('added'); setTimeout(() => { btn.textContent = '+ Carrinho'; btn.classList.remove('added'); }, 1500); }
  };

  badge(); // Atualiza badge ao carregar
}

// ── AUTH ─────────────────────────────────────────────────
export function initAuth() {
  const buildLogado = (isAdmin) => {
    const url  = isAdmin ? 'admin.html' : 'breeder-dashboard.html';
    const nome = isAdmin ? 'Painel Admin' : 'Meu Painel';
    return `<button class="nav-btn primary" onclick="location.href='${url}'">${nome}</button>
            <button class="nav-btn" onclick="window.fazerLogout()">Sair</button>
            <button class="cart-nav-btn" onclick="window.abrirCarrinho()">🛒<span class="cart-badge"></span></button>`;
  };
  const buildGuest = () =>
    `<button class="nav-btn" onclick="window.openModal()">Entrar</button>
     <button class="cart-nav-btn" onclick="window.abrirCarrinho()">🛒<span class="cart-badge"></span></button>`;

  onAuthStateChanged(auth, async (user) => {
    const topLinks = document.getElementById('auth-top-links');
    const navBtn   = document.getElementById('auth-nav-btn');
    if (user) {
      let isAdmin = user.email === 'admin@phenobrasil.com';
      if (!isAdmin) {
        try {
          const d = (await getDoc(doc(db, "users", user.uid))).data();
          if (d?.role === 'admin' || d?.tipo === 'admin') isAdmin = true;
        } catch(_) {}
      }
      if (topLinks) topLinks.innerHTML = `<span style="color:var(--gold)">Conectado: ${user.email}</span>`;
      if (navBtn)   navBtn.innerHTML = buildLogado(isAdmin);
    } else {
      if (topLinks) topLinks.innerHTML = `<a onclick="window.openModal()">Entrar / Login</a>`;
      if (navBtn)   navBtn.innerHTML = buildGuest();
    }
    // Atualiza badge após renderizar botões
    const total = JSON.parse(localStorage.getItem('pheno_cart') || '[]').reduce((s,i) => s+i.qty, 0);
    document.querySelectorAll('.cart-badge').forEach(b => { b.textContent = total; b.classList.toggle('visible', total > 0); });
  });

  window.openModal  = () => { document.getElementById('modal-overlay').style.display = 'flex'; };
  window.closeModal = () => { document.getElementById('modal-overlay').style.display = 'none'; };

  window.fazerLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email-login').value.trim();
    const senha = document.getElementById('pass-login').value;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, senha);
      window.closeModal();
      if (email === 'admin@phenobrasil.com') { location.href = 'admin.html'; return; }
      const d = (await getDoc(doc(db, "users", cred.user.uid))).data();
      if (d?.role === 'admin' || d?.tipo === 'admin') { location.href = 'admin.html'; return; }
      location.href = 'breeder-dashboard.html';
    } catch (err) { alert("Credenciais inválidas: " + err.message); }
  };

  window.fazerLogout = async () => {
    try { await signOut(auth); location.reload(); } catch(_) {}
  };
}
