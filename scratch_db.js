const chatService = require('./src/services/chatService');
const { initializeOracle, closeOracle } = require('./src/config/oracle');

async function test() {
  await initializeOracle();
  try {
    const result = await chatService.sendMessage("admin@example.com", "Me recomende algo com base no que eu já li.");
    console.log("Resposta da IA:");
    console.log(result.reply);
    console.log("\nRecomendações:");
    console.dir(result.recommendations, { depth: null });
  } catch(e) {
    console.error(e);
  } finally {
    await closeOracle();
  }
}

test();
