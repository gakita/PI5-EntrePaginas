const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Configurações e Detecção Dinâmica de Portas
const BACKEND_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '../presentation_screenshots');

// Função para detectar em qual porta o frontend está rodando
async function detectFrontendPort() {
  const ports = [3002, 3001, 5173, 3000];
  console.log('Detectando porta do frontend...');
  for (const port of ports) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 800);
      const res = await fetch(`http://localhost:${port}`, { signal: controller.signal }).catch(() => null);
      clearTimeout(id);
      if (res) {
        console.log(`=> Frontend encontrado com sucesso na porta ${port}!`);
        return `http://localhost:${port}`;
      }
    } catch (e) {
      // Ignorar e tentar próxima porta
    }
  }
  console.log('=> Não foi possível detectar automaticamente a porta. Usando fallback porta 3001.');
  return 'http://localhost:3001';
}

// Usuário de teste persistido no OracleDB no teste anterior
const TEST_EMAIL = 'sensitive_tester@example.com';
const TEST_PASSWORD = 'senha123';

// Função utilitária para delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Função para aguardar todas as imagens (capas de livros) carregarem na tela
async function waitForImagesToLoad(page) {
  console.log('Aguardando o carregamento completo de todas as imagens...');
  try {
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return;
        return new Promise((resolve) => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve);
        });
      }));
    });
    console.log('=> Imagens carregadas com sucesso!');
  } catch (e) {
    console.log('=> Aviso ao aguardar imagens:', e.message);
  }
}

async function run() {
  console.log('📸 === INICIANDO SCRIPT DE CAPTURAS DE TELA AUTOMATIZADAS ===\n');

  const FRONTEND_URL = await detectFrontendPort();

  // Garante que o diretório de saída existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Pasta criada: ${OUTPUT_DIR}\n`);
  }

  console.log('Conectando ao navegador via Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  
  // Ativa logs do console do navegador no terminal do script para debug
  page.on('console', (msg) => {
    if (msg.text().includes('ERROR') || msg.type() === 'error') {
      console.log(`[Browser LOG - ERROR]: ${msg.text()}`);
    }
  });

  try {
    // ==========================================
    // 1. FLUXO DE CADASTRO (ETAPAS 1 A 4)
    // ==========================================
    console.log('\n--- 1. Iniciando Fluxo de Cadastro Fictício (para as fotos dos Slides) ---');
    
    // Habilita interceptação de requisições para mockar o OTP de cadastro
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/auth/send-code')) {
        console.log('[Mock API] Interceptando /auth/send-code -> Sucesso!');
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Código enviado com sucesso para fins de teste.' })
        });
      } else if (url.includes('/auth/verify-code')) {
        console.log('[Mock API] Interceptando /auth/verify-code -> Sucesso!');
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Código validado com sucesso para fins de teste.' })
        });
      } else {
        request.continue();
      }
    });

    console.log('Acessando página de cadastro...');
    await page.goto(`${FRONTEND_URL}/registrar`, { waitUntil: 'networkidle2' });
    
    console.log('Aguardando carregamento da página de cadastro...');
    await page.waitForSelector('input[placeholder="Seu nome completo"]', { timeout: 8000 });
    await delay(1000);

    // Passo 1: Preencher informações básicas
    console.log('Preenchendo Passo 1 do Cadastro...');
    await page.type('input[placeholder="Seu nome completo"]', 'Tester Entre Páginas');
    await page.type('input[placeholder="seu@email.com"]', 'screenshot_tester@example.com');
    await page.type('input[placeholder="••••••••"]', 'senha123');
    
    const shotPath1 = path.join(OUTPUT_DIR, '01_cadastro_passo1.png');
    await page.screenshot({ path: shotPath1 });
    console.log(`📸 Salvo: ${shotPath1}`);

    // Clicar para avançar para o Passo 2
    await page.click('button[type="submit"]');
    await delay(1500);

    // Passo 2: Digitar código OTP
    console.log('Preenchendo Passo 2 (Verificação de E-mail)...');
    const otpInputs = await page.$$('.otp-field input, input[type="text"]');
    
    // Tentando preencher os 6 campos OTP caso estejam separados, ou o input geral
    if (otpInputs.length >= 6) {
      for (let i = 0; i < 6; i++) {
        await otpInputs[i].type('1');
        await delay(50);
      }
    } else {
      // Se for um único input OTP na tela
      const singleInput = await page.$('input[placeholder*="código"], input[placeholder*="Código"]');
      if (singleInput) {
        await singleInput.type('123456');
      }
    }

    const shotPath2 = path.join(OUTPUT_DIR, '02_cadastro_passo2.png');
    await page.screenshot({ path: shotPath2 });
    console.log(`📸 Salvo: ${shotPath2}`);

    // Avançar para o Passo 3
    const nextButtons = await page.$$('button');
    let advancedStep2 = false;
    for (const btn of nextButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Verificar') || text.includes('Confirmar') || text.includes('Avançar')) {
        await btn.click();
        advancedStep2 = true;
        break;
      }
    }
    if (!advancedStep2) {
      // Clique genérico no botão submit atual
      await page.click('button[type="submit"]');
    }
    await delay(1500);

    // Passo 3: Temas Sensíveis
    console.log('Carregando Passo 3 (Escolha de Temas Sensíveis)...');
    // Selecionar alguns temas sensíveis
    const sensitiveChips = await page.$$('.v-chip, .sensitive-chip, [role="button"]');
    if (sensitiveChips.length > 0) {
      // Clica no primeiro e no segundo tema sensível
      await sensitiveChips[0].click();
      if (sensitiveChips[1]) await sensitiveChips[1].click();
    }

    const shotPath3 = path.join(OUTPUT_DIR, '03_cadastro_passo3.png');
    await page.screenshot({ path: shotPath3 });
    console.log(`📸 Salvo: ${shotPath3}`);

    // Avançar para o Passo 4
    let advancedStep3 = false;
    const step3Buttons = await page.$$('button');
    for (const btn of step3Buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Avançar') || text.includes('Continuar')) {
        await btn.click();
        advancedStep3 = true;
        break;
      }
    }
    if (!advancedStep3) {
      await page.click('button[type="submit"]');
    }
    await delay(1500);

    // Passo 4: Gêneros e Subgêneros Favoritos
    console.log('Carregando Passo 4 (Escolha de Gêneros)...');
    const genreChips = await page.$$('.v-chip, [role="button"]');
    if (genreChips.length > 3) {
      await genreChips[0].click();
      await genreChips[1].click();
      await genreChips[2].click();
    }

    const shotPath4 = path.join(OUTPUT_DIR, '04_cadastro_passo4.png');
    await page.screenshot({ path: shotPath4 });
    console.log(`📸 Salvo: ${shotPath4}`);

    // Desativa a interceptação de rede para fazer o fluxo real de login agora!
    await page.setRequestInterception(false);
    page.removeAllListeners('request');

    // ==========================================
    // 2. TELA DE LOGIN (REAL)
    // ==========================================
    console.log('\n--- 2. Acessando e efetuando Login Real ---');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    
    console.log('Aguardando carregamento da página de login...');
    await page.waitForSelector('input[placeholder="seu@email.com"]', { timeout: 8000 });
    await delay(1000);

    console.log(`Preenchendo Login: ${TEST_EMAIL}`);
    await page.type('input[placeholder="seu@email.com"]', TEST_EMAIL);
    await page.type('input[placeholder="••••••••"]', TEST_PASSWORD);

    const shotPath5 = path.join(OUTPUT_DIR, '05_login.png');
    await page.screenshot({ path: shotPath5 });
    console.log(`📸 Salvo: ${shotPath5}`);

    // Clicar para entrar
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {
      console.log('Aviso: Navegação de login tomou timeout ou ocorreu de forma assíncrona.');
    });
    await delay(2000);

    // ==========================================
    // 3. PAINEL PRINCIPAL (HOME)
    // ==========================================
    console.log('\n--- 3. Acessando a Home / Dashboard ---');
    const shotPath6 = path.join(OUTPUT_DIR, '06_home.png');
    await page.screenshot({ path: shotPath6 });
    console.log(`📸 Salvo: ${shotPath6}`);

    // ==========================================
    // 4. CATÁLOGO DE LIVROS
    // ==========================================
    console.log('\n--- 4. Acessando o Catálogo ---');
    await page.goto(`${FRONTEND_URL}/catalogo`, { waitUntil: 'networkidle2' });
    await waitForImagesToLoad(page);
    await delay(1500);

    const shotPath7 = path.join(OUTPUT_DIR, '07_catalogo.png');
    await page.screenshot({ path: shotPath7 });
    console.log(`📸 Salvo: ${shotPath7}`);

    // ==========================================
    // 5. DETALHES DE LIVRO (MÁSCARA SENSÍVEL & REVELAÇÃO)
    // ==========================================
    console.log('\n--- 5. Acessando Detalhes de um Livro ---');
    // Clicar no primeiro livro do catálogo
    const bookCards = await page.$$('.book-card');
    if (bookCards.length > 0) {
      console.log('Clicando no primeiro card de livro do catálogo...');
      await bookCards[0].click();
      await delay(2500); // Aguarda a página do livro carregar os detalhes do Google Books/Banco

      // Clicar em "Adicionar aos favoritos" para que a biblioteca de favoritos tenha itens!
      console.log('Verificando botão de Favoritos...');
      const favBtn = await page.$('.book-card__favorite');
      if (favBtn) {
        const favText = await page.evaluate(el => el.textContent, favBtn);
        if (favText.includes('Adicionar')) {
          console.log('Adicionando o livro aos favoritos para garantir conteúdo na tela de favoritos...');
          await favBtn.click();
          await delay(1000);
        } else {
          console.log('O livro já está nos favoritos.');
        }
      }

      // Tira print com os detalhes (pode estar bloqueado caso o livro seja sensível, ou exibe direto)
      const isSensitiveWarning = await page.$('.sensitive-warning');
      
      if (isSensitiveWarning) {
        console.log('Livro possui temas sensíveis! Capturando tela bloqueada com a máscara de consentimento...');
        const shotPath8 = path.join(OUTPUT_DIR, '08_detalhes_livro_bloqueado.png');
        await page.screenshot({ path: shotPath8 });
        console.log(`📸 Salvo: ${shotPath8}`);

        console.log('Clicando em "Revelar Detalhes" para abrir a sinopse...');
        await page.click('.sensitive-warning__btn');
        await delay(800);

        const shotPath9 = path.join(OUTPUT_DIR, '09_detalhes_livro_revelado.png');
        await page.screenshot({ path: shotPath9 });
        console.log(`📸 Salvo: ${shotPath9}`);
      } else {
        console.log('Livro não classificado como sensível. Tirando print normal da sinopse...');
        const shotPath8 = path.join(OUTPUT_DIR, '08_detalhes_livro.png');
        await page.screenshot({ path: shotPath8 });
        console.log(`📸 Salvo: ${shotPath8}`);
      }
    } else {
      console.log('Aviso: Nenhum card de livro encontrado no catálogo para clicar.');
    }

    // ==========================================
    // 6. CHATBOT IA (GEMINI RECOMENDAÇÕES)
    // ==========================================
    console.log('\n--- 6. Acessando o Chatbot IA ---');
    await page.goto(`${FRONTEND_URL}/chatbot`, { waitUntil: 'networkidle2' });
    await delay(1500);

    console.log('Enviando mensagem de recomendação para o Chatbot...');
    const chatInput = await page.$('.chat-input input, textarea, input[type="text"]');
    if (chatInput) {
      await chatInput.type('Me sugira três ótimos livros de terror psicológico de tirar o fôlego!');
      await delay(200);
      
      // Procurando o botão de enviar do chat e clicando
      const sendButton = await page.$('.send-button, button[type="submit"], button .v-icon[icon="mdi-send"]');
      if (sendButton) {
        await sendButton.click();
      } else {
        // Envia pressionando Enter
        await page.keyboard.press('Enter');
      }
      
      console.log('Mensagem enviada. Aguardando 8 segundos para resposta do Gemini...');
      await delay(8500); // Dá um tempo maior para a IA pensar e responder com os livros completos

      const shotPath10 = path.join(OUTPUT_DIR, '10_chatbot.png');
      await page.screenshot({ path: shotPath10 });
      console.log(`📸 Salvo: ${shotPath10}`);

      // Se houver botões de revelação para livros recomendados sensíveis no chat
      const chatRevealBtn = await page.$('.sensitive-btn');
      if (chatRevealBtn) {
        console.log('Recomendação sensível encontrada no chat! Revelando...');
        await chatRevealBtn.click();
        await delay(800);

        const shotPath11 = path.join(OUTPUT_DIR, '11_chatbot_revelado.png');
        await page.screenshot({ path: shotPath11 });
        console.log(`📸 Salvo: ${shotPath11}`);
      }
    } else {
      console.log('Aviso: Input do chatbot não encontrado.');
    }

    // ==========================================
    // 7. QUIZ ADAPTATIVO
    // ==========================================
    console.log('\n--- 7. Acessando o Quiz Adaptativo ---');
    await page.goto(`${FRONTEND_URL}/quiz`, { waitUntil: 'networkidle2' });
    await delay(1500);

    const shotPath12 = path.join(OUTPUT_DIR, '12_quiz.png');
    await page.screenshot({ path: shotPath12 });
    console.log(`📸 Salvo: ${shotPath12}`);

    // ==========================================
    // 8. TELA DE RECOMENDAÇÕES
    // ==========================================
    console.log('\n--- 8. Acessando as Recomendações do Perfil ---');
    await page.goto(`${FRONTEND_URL}/recomendacoes`, { waitUntil: 'networkidle2' });
    await waitForImagesToLoad(page);
    await delay(1500);

    const shotPath13 = path.join(OUTPUT_DIR, '13_recomendacoes.png');
    await page.screenshot({ path: shotPath13 });
    console.log(`📸 Salvo: ${shotPath13}`);

    // ==========================================
    // 9. FAVORITOS
    // ==========================================
    console.log('\n--- 9. Acessando a Tela de Favoritos ---');
    await page.goto(`${FRONTEND_URL}/favoritos`, { waitUntil: 'networkidle2' });
    await waitForImagesToLoad(page);
    await delay(1500);

    const shotPath14 = path.join(OUTPUT_DIR, '14_favoritos.png');
    await page.screenshot({ path: shotPath14 });
    console.log(`📸 Salvo: ${shotPath14}`);

    // ==========================================
    // 10. PERFIL
    // ==========================================
    console.log('\n--- 10. Acessando a Tela de Perfil ---');
    await page.goto(`${FRONTEND_URL}/perfil`, { waitUntil: 'networkidle2' });
    await delay(1500);

    const shotPath15 = path.join(OUTPUT_DIR, '15_perfil.png');
    await page.screenshot({ path: shotPath15 });
    console.log(`📸 Salvo: ${shotPath15}`);

    console.log('\n🎉 Todos os screenshots foram tirados com sucesso!');
    console.log(`Verifique os arquivos gerados em: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('\n❌ Ocorreu um erro durante a automação:', error);
  } finally {
    console.log('Encerrando navegador...');
    await browser.close();
    console.log('\n=== FLUXO CONCLUÍDO ===');
  }
}

run();
