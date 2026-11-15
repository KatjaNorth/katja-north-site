// Собирает адрес почты в ссылку (в тексте страницы он записан в виде, неудобном для спам-роботов).
document.querySelectorAll('.mail').forEach(function (el) {
  var addr = el.getAttribute('data-u') + '@' + el.getAttribute('data-d');
  var a = document.createElement('a');
  a.href = 'mailto:' + addr;
  a.textContent = addr;
  a.translate = false;
  el.replaceWith(a);
});
