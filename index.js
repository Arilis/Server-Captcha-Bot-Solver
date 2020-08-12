console.clear()
const Discord = require(`discord.js.old`)
const Client = new Discord.Client()
const Config = require(`./resources/config`)
const request = require(`request`).defaults({encoding: null})
const fs = require(`fs`)
const download = require(`download`)
var CircularJSON = require('circular-json')
const { Buffer } = require('buffer')
var anticaptcha = require('./resources/anticaptcha')(Config.AntiCaptchaAPIKey);

async function log(string) {
    try {
        console.log(`[Server Catpcha Bot Solver ${Config.Version}]: ${string}`)
    } catch(e) {console.error(e)}
}

async function getResult(i,callback) {
    anticaptcha.getBalance(async (e,r) => {
        if (e) console.error(e)
        anticaptcha.setMinLength(5)

        if (r > 0) {
            log(`Remaining credit balance: ${r}`)
            anticaptcha.createImageToTextTask({case:true, body: `${i}`}, async (e,taskId) => {
                if (e) console.error(e)
                log(`Task ID retrieved: ${taskId}`)
                log(`Attempting to find solution.`)
                anticaptcha.getTaskSolution(taskId, async (e,solution) => {
                    if (e) console.error(e)
                    log(`Possible solution found: ${solution}`)
                    callback(solution)
                })
            })
        } else {
            log(`You have ran out of credits!`)
            callback(null)
        }
    })
}

async function createKey(int) {
    var result = ``
    var characters = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`
    var charactersLength = characters.length
    for ( var i = 0; i < int; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}

Client.on(`ready`, () => {
    log(`Client connected to server.`)
})

Client.on(`message`, async (msg) => {
    try {
        if (msg.author.id == `512333785338216465` && msg.channel.type == `dm`) {
            msg.embeds.forEach(async (embed) => {
                if (CircularJSON.stringify(embed).length > 17500) {
                    var Data = await JSON.parse(CircularJSON.stringify(embed))
                    var CaptchaURL = await Data.image.url
                    var Download = await download(`${CaptchaURL}`)
                    var Key = await createKey(6)
                    fs.writeFileSync(`./resources/temp/${await Key}.png`, Download)
                    var FileData = await fs.readFileSync(`./resources/temp/${Key}.png`)
                    var B64 = new Buffer.from(FileData).toString(`base64`)
                    getResult(B64, async (r) => {
                        if (r) {
                            msg.channel.send(r)
                            fs.unlinkSync(`./resources/temp/${Key}.png`)
                        }
                    })
                }
            })
        }
    } catch(e) {console.error(e)}
})

Client.login(Config.Token)