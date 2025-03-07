module.exports = {
  taskHiveApi: {
    output: {
      target: "src/api/generated.ts",  // Arquivo gerado com os hooks
      schemas: "src/api/schemas",     // Pasta onde os schemas serão armazenados
    },
    input: "./swagger.json",      // Caminho para o JSON do Swagger
  },
};