/**
 * hSenid Mobile Cloud Assignment Store - Client-Side JavaScript
 * ---------------------------------------------------------------
 * Handles image preview and cart quantity controls.
 */

document.addEventListener('DOMContentLoaded', function () {

  // ---- Image Preview on File Select ----
  const imageInput = document.getElementById('image');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');

  if (imageInput && imagePreview && previewImg) {
    imageInput.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (file) {
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('File is too large. Maximum size is 5MB.');
          imageInput.value = '';
          imagePreview.style.display = 'none';
          return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
          previewImg.src = event.target.result;
          imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        imagePreview.style.display = 'none';
      }
    });
  }

  // ---- Cart Quantity +/- Buttons ----
  document.querySelectorAll('.qty-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const input = this.closest('.input-group').querySelector('.qty-input');
      let value = parseInt(input.value, 10) || 1;

      if (this.dataset.action === 'increase') {
        value = Math.min(value + 1, 99);
      } else if (this.dataset.action === 'decrease') {
        value = Math.max(value - 1, 1);
      }

      input.value = value;
    });
  });

  // ---- Auto-dismiss alerts after 5 seconds ----
  document.querySelectorAll('.alert-dismissible').forEach(function (alert) {
    setTimeout(function () {
      var bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      if (bsAlert) {
        bsAlert.close();
      }
    }, 5000);
  });
});
