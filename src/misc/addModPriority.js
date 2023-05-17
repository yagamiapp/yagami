let { prisma } = require('../lib/prisma');

(async function main() {
  let maps = await prisma.mapInPool.findMany();

  for (const map of maps) {
    let modType = map.identifier.match(/\w{2}/g)[0];
    let modPrio = {
      NM: 0,
      HD: 1,
      HR: 2,
      DT: 3,
      HT: 4,
      EZ: 5,
      FL: 6,
      FM: 8,
      TB: 9,
    };
    let mod = modPrio[modType];
    if (mod == undefined) mod = 7;

    await prisma.mapInPool.update({
      where: {
        identifier_mappoolId: {
          identifier: map.identifier,
          mappoolId: map.mappoolId,
        },
      },
      data: {
        modPriority: mod,
      },
    });
  }
})();
