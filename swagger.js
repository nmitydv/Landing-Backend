import swaggerAutogen from 'swagger-autogen';

const swagger = swaggerAutogen();

const doc = {
  info: {
    title: 'Node.js User API',
    description: "API documentation for Academic Website"
  },
  host: 'localhost:5000',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const routes = ['./app.js'];

swagger(outputFile, routes, doc);
