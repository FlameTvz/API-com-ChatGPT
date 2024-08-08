import initDB from "./database";

async function seed() {
    const db = await initDB()

    const infos = [
        "Caminho de Luxo tem 20 andares com cada andar contendo 4 apartamentos.",
    ];

    for (const info of infos){
        await db.run('INSERT INTO building_info (info) VALUES (?)', info)
    }

    console.log('Dados inseridos com sucesso.');
}


seed();