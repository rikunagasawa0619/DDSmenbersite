export function ThemeScript() {
  const code = `
    try {
      const stored = localStorage.getItem('dds-theme');
      const theme = stored === 'dark' || stored === 'light'
        ? stored
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.dataset.theme = theme;
    } catch {}
  `;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
