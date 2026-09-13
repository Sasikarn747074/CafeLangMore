document.addEventListener('DOMContentLoaded', () => {
  // ------------------------------------------
  // ฟังก์ชันส่วนกลาง: อัปเดตตัวเลขบนปุ่มรถเข็น
  // ------------------------------------------
  function updateCartBadge() {
    const rawCart = localStorage.getItem('langmore_cart') || localStorage.getItem('cartItems') || localStorage.getItem('cart');
    const cart = rawCart ? JSON.parse(rawCart) : [];
    const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    const cartBadge = document.querySelector('.cart-badge') || document.getElementById('cart-count');
    if (cartBadge) {
      cartBadge.textContent = totalCount;
    }
  }

  updateCartBadge();

  // ==========================================
  // 1. ส่วนของหน้า product.html
  // ==========================================
  const productList = document.getElementById('product-list');
  if (productList) {
    fetch('products.json')
      .then(response => response.json())
      .then(products => {
        productList.innerHTML = '';
        products.forEach(product => {
          const card = document.createElement('div');
          card.className = 'product-card';
          
          const orderUrl = `order.html?item=${encodeURIComponent(product.name)}&price=${encodeURIComponent(product.price)}`;
          
          card.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="category">ประเภท: ${product.category || 'เครื่องดื่ม/ขนม'}</p>
            <p class="price">ราคา: ${product.price} บาท</p>
            <a href="${orderUrl}" class="btn-order" data-name="${product.name}" data-price="${product.price}">สั่งซื้อ</a>
          `;
          productList.appendChild(card);
        });

        document.querySelectorAll('.btn-order').forEach(button => {
          button.addEventListener('click', (e) => {
            const name = e.currentTarget.getAttribute('data-name');
            const price = parseFloat(e.currentTarget.getAttribute('data-price'));

            const rawCart = localStorage.getItem('langmore_cart') || localStorage.getItem('cartItems') || localStorage.getItem('cart');
            let cart = rawCart ? JSON.parse(rawCart) : [];

            const existingIndex = cart.findIndex(item => item.name === name);
            if (existingIndex > -1) {
              cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
            } else {
              cart.push({
                name: name,
                price: price,
                quantity: 1,
                option: '',
                note: ''
              });
            }

            localStorage.setItem('langmore_cart', JSON.stringify(cart));
            localStorage.setItem('cartItems', JSON.stringify(cart));
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartBadge();
          });
        });
      })
      .catch(error => console.error('Error loading products:', error));
  }

  // ==========================================
  // 2. ส่วนของหน้า order.html
  // ==========================================
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    const cartSummaryBox = document.getElementById('cart-summary-box');
    const itemsInput = document.getElementById('items');
    const totalInput = document.getElementById('total');

    const urlParams = new URLSearchParams(window.location.search);
    const paramItem = urlParams.get('item');
    const paramPrice = urlParams.get('price');

    const rawCart = localStorage.getItem('langmore_cart') || localStorage.getItem('cartItems') || localStorage.getItem('cart');
    let cart = rawCart ? JSON.parse(rawCart) : [];

    if (paramItem && paramPrice) {
      const priceNum = parseFloat(paramPrice);
      const existingIndex = cart.findIndex(item => item.name === paramItem);
      if (existingIndex === -1) {
        cart.push({
          name: paramItem,
          price: priceNum,
          quantity: 1,
          option: '',
          note: ''
        });
        localStorage.setItem('langmore_cart', JSON.stringify(cart));
        localStorage.setItem('cartItems', JSON.stringify(cart));
        localStorage.setItem('cart', JSON.stringify(cart));
      }
    }

    if (!cart || cart.length === 0) {
      if (cartSummaryBox) {
        cartSummaryBox.innerHTML = `
          <div style="text-align: center; color: #7A726C; padding: 1.5rem 1rem;">
            ยังไม่มีสินค้าในตะกร้า <br><br>
            <a href="product.html" style="color: #6F4E37; text-decoration: underline; font-weight: 600;">ไปเลือกซื้อสินค้ากันเลย!</a>
          </div>
        `;
      }
      if (totalInput) totalInput.value = '0';
    } else {
      let grandTotal = 0;
      let itemsTextArray = [];

      if (cartSummaryBox) cartSummaryBox.innerHTML = '';

      cart.forEach((item, index) => {
        const qty = item.quantity || 1;
        const itemTotal = item.price * qty;
        grandTotal += itemTotal;

        const optionText = item.option ? ` [${item.option}]` : '';
        const noteText = item.note ? ` (หมายเหตุ: ${item.note})` : '';
        itemsTextArray.push(`${index + 1}. ${item.name}${optionText} x${qty} = ${itemTotal} บาท${noteText}`);

        if (cartSummaryBox) {
          cartSummaryBox.innerHTML += `
            <div class="summary-item" style="padding-bottom: 0.75rem; margin-bottom: 0.75rem; border-bottom: 1px dashed #EBE5DF;">
              <div class="item-main" style="display: flex; justify-content: space-between; font-weight: 600; color: #332C27;">
                <span>${item.name} ${item.option ? `<small style="color:#7A726C;">[${item.option}]</small>` : ''} x ${qty}</span>
                <span>${itemTotal} บาท</span>
              </div>
              ${item.note ? `<div class="item-menu-note" style="font-size: 0.85rem; color: #8C6D58; margin-top: 0.25rem; padding-left: 0.5rem;">└ หมายเหตุ: ${item.note}</div>` : ''}
            </div>
          `;
        }
      });

      if (itemsInput) itemsInput.value = itemsTextArray.join('\n');
      if (totalInput) totalInput.value = grandTotal;
    }

    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = orderForm.querySelector('button[type="submit"]') || orderForm.querySelector('.btn-submit');
      if (submitBtn && submitBtn.disabled) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'กำลังส่งออเดอร์... ⏳';
      }

      const payload = {
        customerName: document.getElementById('customerName').value,
        contact: document.getElementById('contact').value,
        items: document.getElementById('items').value,
        total: document.getElementById('total').value,
        note: document.getElementById('note').value
      };

      fetch('https://script.google.com/macros/s/AKfycbxMxMzZteTxocjr6rbgGxxRfCczaKyz62-9gk4YC2Ga27XJfuYhGnm0xs0yCuCaTLiD/exec', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      .then(() => {
        localStorage.removeItem('langmore_cart');
        localStorage.removeItem('cartItems');
        localStorage.removeItem('cart');
        window.location.href = 'thankyou.html';
      })
      .catch(error => {
        console.error(error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'ยืนยันการสั่งซื้อ';
        }
      });
    });
  }

  // ==========================================
  // 3. ส่วนของหน้า admin.html
  // ==========================================
  const ordersTableBody = document.querySelector('#ordersTable tbody');
  if (ordersTableBody) {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbxMxMzZteTxocjr6rbgGxxRfCczaKyz62-9gk4YC2Ga27XJfuYhGnm0xs0yCuCaTLiD/exec';

    fetch(scriptUrl)
      .then(response => response.json())
      .then(result => {
        if (result.status === 'success') {
          const rows = result.data;
          ordersTableBody.innerHTML = '';

          for (let i = rows.length - 1; i >= 1; i--) {
            const row = rows[i];
            if (row && row.length >= 4 && String(row[0]).trim() !== '') {
              const timestamp = row[0] || '-';
              const name = row[1] || '-';
              const contact = row[2] || '-';
              const items = row[3] ? String(row[3]).replace(/\n/g, '<br>') : '-';
              const total = row[4] || '0';
              const note = row[5] || '-';

              const tr = document.createElement('tr');
              tr.innerHTML = `
                <td style="white-space: nowrap;">${timestamp}</td>
                <td><strong>${name}</strong></td>
                <td>${contact}</td>
                <td style="text-align: left;">${items}</td>
                <td><strong style="color:#6F4E37;">${total} บาท</strong></td>
                <td>${note}</td>
              `;
              ordersTableBody.appendChild(tr);
            }
          }

          if (ordersTableBody.children.length === 0) {
            ordersTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#7A726C; padding: 2rem;">ยังไม่มีรายการสั่งซื้อเข้ามาในขณะนี้</td></tr>`;
          }
        } else {
          throw new Error('API Error');
        }
      })
      .catch(error => {
        console.error('Error loading orders:', error);
        ordersTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding: 2rem;">ไม่สามารถดึงข้อมูลออเดอร์ได้ กรุณาตรวจสอบลิงก์ Google Apps Script</td></tr>`;
      });
  }
});