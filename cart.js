document.addEventListener('DOMContentLoaded', ()=>{
  const CART_KEY = 'vovajon_cart_v1';

  function readCart(){
    try{ return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }catch(e){ return []; }
  }
  function writeCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

  function updateCartButton(){
    const cart = readCart();
    const total = cart.reduce((s,i)=>s+i.qty,0);
    const btn = document.querySelector('.cart-btn');
    if(btn) btn.textContent = `Кошик (${total})`;
  }

  function addProduct(name, price){
    const cart = readCart();
    const item = cart.find(i=>i.name===name);
    if(item) item.qty += 1; else cart.push({name, qty:1, price: price || 0});
    writeCart(cart); updateCartButton();
  }

  document.querySelectorAll('.add-to-cart').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const product = btn.closest('.product');
      const name = product?.querySelector('h2')?.textContent?.trim() || 'Товар';
      const price = parseFloat(product?.dataset?.price) || 0;
      addProduct(name, price);
    });
  });

  // View toggles
  const mainView = document.getElementById('main-view');
  const cartView = document.getElementById('cart-view');
  const cartListEl = document.querySelector('.cart-list');

  function renderCartList(){
    const cart = readCart();
    cartListEl.innerHTML = '';
    const totalAmountEl = document.querySelector('.total-amount');
    if(cart.length === 0){
      const empty = document.createElement('div');
      empty.className = 'cart-empty';
      empty.textContent = 'Кошик порожній';
      cartListEl.appendChild(empty);
      if(totalAmountEl) totalAmountEl.textContent = '0';
      return;
    }
    let total = 0;
    cart.forEach(item=>{
      const price = Number(item.price || 0);
      const lineTotal = price * (item.qty || 0);
      total += lineTotal;

      const card = document.createElement('div');
      card.className = 'cart-item';

      const left = document.createElement('div');
      left.className = 'item-left';
      left.innerHTML = `<strong>${item.name}</strong><span class="item-price">${price}₴ × ${item.qty}</span>`;

      const right = document.createElement('div');
      right.className = 'item-right';
      right.innerHTML = `<strong>${lineTotal}₴</strong>`;

      card.appendChild(left);
      card.appendChild(right);
      cartListEl.appendChild(card);
    });
    if(totalAmountEl) totalAmountEl.textContent = total;
  }

  function showCartView(){
    if(mainView) mainView.classList.add('hidden');
    if(cartView) cartView.classList.remove('hidden');
    renderCartList();
  }
  function hideCartView(){
    if(cartView) cartView.classList.add('hidden');
    if(mainView) mainView.classList.remove('hidden');
  }

  const cartButton = document.querySelector('.cart-btn');
  if(cartButton){
    cartButton.addEventListener('click', (e)=>{
      e.preventDefault();
      showCartView();
    });
  }

  const exitBtn = document.querySelector('.exit-btn');
  if(exitBtn) exitBtn.addEventListener('click', hideCartView);

  function clearCart(){ writeCart([]); updateCartButton(); renderCartList(); }
  const clearBtn = document.querySelector('.clear-btn');
  if(clearBtn) clearBtn.addEventListener('click', clearCart);

  async function exportCartToFolder(){
    const cart = readCart();
    const content = (() =>{
      if(!cart.length) return 'Кошик порожній';
      const lines = cart.map(i=>{
        const price = Number(i.price || 0);
        return `${i.name} x ${i.qty} — ${price}₴ each`;
      });
      const total = cart.reduce((s,i)=>s + (Number(i.price||0) * (i.qty||0)), 0);
      lines.push('');
      lines.push(`Разом: ${total}₴`);
      return lines.join('\n');
    })();

    function fallbackDownload(text){
      const blob = new Blob([text], {type:'text/plain'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'cart_summary.txt';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }

    if(window.showDirectoryPicker){
      try{
        const dirHandle = await window.showDirectoryPicker();
        const fileHandle = await dirHandle.getFileHandle('cart_summary.txt', {create:true});
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        alert('Файл "cart_summary.txt" створено в обраній папці.');
      }catch(err){
        console.error(err);
        fallbackDownload(content);
      }
    } else {
      fallbackDownload(content);
    }
  }

  const exportBtn = document.querySelector('.export-btn');
  if(exportBtn) exportBtn.addEventListener('click', exportCartToFolder);

  // Buy button -> prompt for email and open mail client with cart summary
  function buildCartText(){
    const cart = readCart();
    if(!cart.length) return 'Кошик порожній';
    const lines = cart.map(i=>{
      const price = Number(i.price || 0);
      return `${i.name} x ${i.qty} — ${price}₴ each`;
    });
    const total = cart.reduce((s,i)=>s + (Number(i.price||0) * (i.qty||0)), 0);
    lines.push('');
    lines.push(`Разом: ${total}₴`);
    return lines.join('\n');
  }

  const buyBtn = document.querySelector('.buy-btn');
  if(buyBtn){
    buyBtn.addEventListener('click', ()=>{
      const cart = readCart();
      if(cart.length === 0){ alert('Кошик порожній'); return; }
      const email = prompt('Введіть вашу електронну пошту для отримання підтвердження:');
      if(!email) { alert('Скасовано'); return; }
      // basic validation
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ alert('Невірний формат пошти'); return; }
      const subject = encodeURIComponent('Замовлення з Vovajon');
      const body = encodeURIComponent(buildCartText());
      // open default mail client
      const mailto = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
      window.location.href = mailto;
    });
  }

  // Workers tab behavior: show/hide and scroll
  const workersBtn = document.querySelector('.workers-btn');
  const workersTab = document.getElementById('workers-tab');
  const workersClose = document.querySelector('.workers-close');
  const workersScroll = document.querySelector('.workers-scroll');

  if(workersBtn && workersTab){
    workersBtn.addEventListener('click', ()=>{
      workersTab.classList.remove('hidden');
      workersTab.scrollIntoView({behavior:'smooth', block:'center'});
    });
  }
  if(workersClose && workersTab){
    workersClose.addEventListener('click', ()=>{
      workersTab.classList.add('hidden');
    });
  }
  if(workersScroll && workersTab){
    workersScroll.addEventListener('click', ()=>{
      workersTab.scrollIntoView({behavior:'smooth', block:'center'});
    });
  }

  updateCartButton();
});
