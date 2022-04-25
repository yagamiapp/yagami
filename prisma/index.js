const prismaClientBuilder = require("@prisma/client");
const prisma = new prismaClientBuilder.PrismaClient();
module.exports = {
	prisma,
};
