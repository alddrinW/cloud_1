const fs = require('fs');
const { execSync } = require('child_process');

// Leer archivo Markdown
const mdContent = fs.readFileSync('INFORME_ENTREGABLE.md', 'utf-8');

// Parser markdown simple pero robusto a HTML
function mdToHtml(md) {
  let html = md;

  // Escapar caracteres html básicos en texto plano excepto etiquetas que creemos
  // Bloques de código ```
  html = html.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre class="code-block language-${lang}"><code>${escaped}</code></pre>`;
  });

  // Tablas Markdown
  html = html.replace(/\n(\|.+?\|\n\|[-:| ]+\|\n(?:\|.+?\|\n?)+)/g, (match, table) => {
    const lines = table.trim().split('\n');
    const headerLine = lines[0];
    const headers = headerLine
      .split('|')
      .slice(1, -1)
      .map(h => `<th>${h.trim()}</th>`)
      .join('');
    
    const rows = lines.slice(2).map(line => {
      const cells = line
        .split('|')
        .slice(1, -1)
        .map(c => `<td>${c.trim()}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    }).join('\n');

    return `\n<table class="styled-table">\n<thead><tr>${headers}</tr></thead>\n<tbody>\n${rows}\n</tbody>\n</table>\n`;
  });

  // Encabezados
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Separadores horizontales
  html = html.replace(/^---$/gim, '<hr/>');

  // Negrita y Cursiva
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Código en línea
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Listas desordenadas
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Listas ordenadas
  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>');

  // Párrafos (líneas que no son tags HTML)
  const lines = html.split('\n');
  const processed = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('</pre') ||
        trimmed.startsWith('<table') || trimmed.startsWith('</table') || trimmed.startsWith('<thead') ||
        trimmed.startsWith('<tbody') || trimmed.startsWith('<tr') || trimmed.startsWith('</tr') ||
        trimmed.startsWith('<th') || trimmed.startsWith('<td') || trimmed.startsWith('<ul') ||
        trimmed.startsWith('</ul') || trimmed.startsWith('<li') || trimmed.startsWith('</li') ||
        trimmed.startsWith('<hr') || trimmed.startsWith('<code') || trimmed.startsWith('</code')) {
      return line;
    }
    return `<p>${line}</p>`;
  });

  return processed.join('\n');
}

const bodyHtml = mdToHtml(mdContent);

const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe - Ejecución Reproducible de Aplicación Contenerizada</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #24292e;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 20pt;
      color: #0366d6;
      border-bottom: 2px solid #eaecef;
      padding-bottom: 8px;
      margin-top: 24px;
      margin-bottom: 16px;
      text-align: center;
    }
    h2 {
      font-size: 14pt;
      color: #1b1f23;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    h3 {
      font-size: 12pt;
      color: #24292e;
      margin-top: 18px;
      margin-bottom: 8px;
    }
    p {
      margin-top: 0;
      margin-bottom: 10px;
    }
    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 9.5pt;
      background-color: #f6f8fa;
      padding: 2px 5px;
      border-radius: 4px;
      color: #032f62;
      border: 1px solid #e1e4e8;
    }
    pre.code-block {
      background-color: #f6f8fa;
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      padding: 12px;
      overflow-x: auto;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 9pt;
      line-height: 1.45;
      margin-bottom: 14px;
    }
    pre.code-block code {
      background: none;
      padding: 0;
      border: none;
      color: #24292e;
    }
    table.styled-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 10pt;
    }
    table.styled-table th, table.styled-table td {
      border: 1px solid #dfe2e5;
      padding: 8px 12px;
      text-align: left;
    }
    table.styled-table th {
      background-color: #f1f8ff;
      color: #0366d6;
      font-weight: 600;
    }
    table.styled-table tr:nth-child(even) {
      background-color: #fbfbfc;
    }
    hr {
      border: 0;
      height: 1px;
      background: #e1e4e8;
      margin: 20px 0;
    }
    ul {
      margin-top: 0;
      margin-bottom: 12px;
      padding-left: 24px;
    }
    li {
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

fs.writeFileSync('informe.html', fullHtml);
console.log('HTML estilizado generado con éxito en informe.html');

try {
  execSync('libreoffice --headless --convert-to pdf informe.html && mv informe.pdf INFORME_ENTREGABLE.pdf');
  console.log('PDF generado exitosamente como INFORME_ENTREGABLE.pdf');
} catch (e) {
  console.error('Error generando PDF:', e.message);
}
