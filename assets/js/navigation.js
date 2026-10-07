const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-navigation');

if (menuButton && navigation) {
  const desktopLayout = window.matchMedia('(min-width: 761px)');

  function closeMenu(returnFocus = false) {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');

    if (returnFocus) {
      menuButton.focus();
    }
  }

  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    const nextState = !isOpen;

    menuButton.setAttribute('aria-expanded', String(nextState));
    menuButton.setAttribute('aria-label', nextState ? 'Закрыть меню' : 'Открыть меню');
    navigation.classList.toggle('is-open', nextState);
  });

  navigation.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
      closeMenu(true);
    }
  });

  desktopLayout.addEventListener('change', (event) => {
    if (event.matches) {
      closeMenu();
    }
  });
}
