const express    = require('express');
const dotenv     = require('dotenv');
const bodyParser = require("body-parser")
const fs         = require("fs")
const uuid       = require("uuid")
dotenv.config();

const app  = express();
const port = process.env.service_port_api;

let cors_origin = process.env.cors_origin.split(' ')
let cors        = require('cors')
let corsOptions = {
    credentials: true,
    origin: cors_origin
}
app.use(cors(corsOptions))

app.use(bodyParser.json({ limit: '10mb' }));
app.use("/", express.static('user_data'))


app.get('/get_fotos_entrenamiento', async (req, res) => {
    console.log('/get_fotos_entrenamiento')//, req.body);

    try {
        let data_ = await global.knex('foto_entrenamiento')
        
        return res.status(200).send({ "stat": true, "data": data_ });
    } catch (error) {
        console.log(error)
        return res.status(200).send({ "stat": false, error: "Error Interno, reintente luego." });
    }
})

app.post('/foto_entrenamiento', async (req, res) => {
    console.log('/foto_entrenamiento')//, req.body);
    try {
        const TS_REQ = new Date()

        if (!req.body?.objeto || req.body?.objeto?.length > 255) {
            return res.status(200).send({ "stat": false, error: "Revise el título." });
        }

        if (!req.body?.detalles || req.body?.detalles?.length > 1024) {
            return res.status(200).send({ "stat": false, error: "Revise el detalle." });
        }
        
        if (!req.body?.posicion ) {
            return res.status(200).send({ "stat": false, error: "Revise coordenadas." });
        }

        let files_data = []

        const IMG          = req.body.imagen.base64
        const ID_IMG       = uuid.v7()
        const base64String = IMG.split(',');
        const extension    = base64String[0].split(':')[1].split(';')[0].replace('/', '.')
        const fileName     = "./user_data/" + ID_IMG + extension
        const buffer       = Buffer.from(base64String[1], 'base64');
        fs.writeFileSync(fileName, buffer)

        files_data.push({ id: ID_IMG, extension: extension })
        

        const INS_OBJ = {
            id: uuid.v7(),
            objeto: req.body.objeto,
            detalles: req.body.detalles,
            posicion: JSON.stringify(req.body.posicion),
            imagen: JSON.stringify(files_data),
            ts: TS_REQ,
            ipv4: req.header('x-forwarded-for') ? req.header('x-forwarded-for') : '-',
            ipv6: '-',
            user_agent: req.header('user-agent') ? req.header('user-agent') : '-',
        }

        console.log(INS_OBJ)
        await global.knex('foto_entrenamiento').insert(INS_OBJ);
        return res.status(200).send({ "stat": true });
    } catch (error) {
        console.log(error)
        return res.status(200).send({ "stat": false, error: "Error Interno, reintente luego." });
    }
});


app.listen(port, () => {
    console.log(`Servidor escuchando en puerto ${port}`);
});

let conn_obj = {
    host: process.env.mysql_host,
  //  port: process.env.mysql_port,
    user: process.env.mysql_user,
    password: process.env.mysql_password,
    database: process.env.mysql_database,
    supportBigNumbers: true,
    bigNumberStrings: true,
    typeCast: function (field, next) {
        if (field.type == "NEWDECIMAL") {
            var value = field.string();
            return (value === null) ? null : Number(value);
        }
        return next();
    }
  
  }
  
global.knex = require('knex')({
    client: 'mysql2',
    connection: conn_obj,
    pool: { min: 0, max: 1000, "propagateCreateError": false }
});
