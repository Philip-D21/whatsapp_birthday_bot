const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const fs = require('fs')
const schedule = require('node-schedule')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const axios = require('axios')

async function startBot() {
    // Use multi-file auth state for better reliability + plus you wouldn't be scanning qr code every time
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
    })

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr) {
            qrcode.generate(qr, { small: true })
            console.log('QR Code displayed. Please scan with WhatsApp.')
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect)
            
            if (shouldReconnect) {
                startBot()
            }
        } else if (connection === 'open') {
            console.log('Connected')
        }
    })

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.key.fromMe && m.message) {
            const messageContent = m.message.conversation || m.message.extendedTextMessage?.text || ''
            const sender = m.key.remoteJid
            const isGroup = sender.endsWith('@g.us')
        
        }
    })

    // Save credentials whenever they are updated
    sock.ev.on('creds.update', saveCreds)


    // see available groups joined
    sock.ev.on('connection.update', async (update) => {
        const { connection } = update
        if (connection === 'open') {
            console.log('✅ Connected! Fetching joined groups...')
    
            try {
                const groups = await sock.groupFetchAllParticipating()
                console.log('📋 Joined Groups:')
                Object.entries(groups).forEach(([id, group]) => {
                    console.log(`- ${group.subject} | ID: ${id}`)
                })
            } catch (error) {
                console.error('❌ Failed to fetch group list:', error)
            }
        }
    })

    // Schedule job to run in 20 seconds
    const date = new Date()
    date.setSeconds(date.getSeconds() + 3)
    console.log("debug1")
    console.log(date)
    
    schedule.scheduleJob(date, async () => {
        try {
            const birthdays = JSON.parse(fs.readFileSync('birthdays.json'))
            const today = new Date().toISOString().slice(5, 10)
    
            for (const person of birthdays) {
                if (person.date === today) {
                    const mentionJid = person.jid // e.g., '1234567890@s.whatsapp.net' basically the user phone number
                    const groupJid = person.group
    
                    if (!groupJid) {
                        console.log(`❌ No group ID specified for ${person.name}`)
                        continue
                    }

                    const messageText = `🎉 Happy Birthday to @${mentionJid.split('@')[0]}! 🎂 Let's all celebrate the champion!`
    
                    if (person.image) {
                        try {
                            console.log('📥 Downloading image from:', person.image)
                            const response = await axios.get(person.image, {
                                responseType: 'arraybuffer',
                                headers: { 'Accept': 'image/*' }
                            })
    
                            if (!response.data) throw new Error('No image data')
    
                            const imageBuffer = Buffer.from(response.data)
                            console.log('Image downloaded successfully, size:', imageBuffer.length)
    
                            await sock.sendMessage(groupJid, {
                                image: imageBuffer,
                                caption: messageText,
                                mentions: [mentionJid]
                            })
                            console.log(`📸 Sent image birthday message for ${person.name} in group`)
                        } catch (error) {
                            console.error('❌ Error sending image:', error.message)
                            await sock.sendMessage(groupJid, {
                                text: messageText,
                                mentions: [mentionJid]
                            })
                        }
                    } else {
                        await sock.sendMessage(groupJid, {
                            text: messageText,
                            mentions: [mentionJid]
                        })
                        console.log(`📨 Sent text birthday message for ${person.name} in group`)
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error sending birthday messages:', error)
        }
    })

    console.log("✅ Birthday bot is running and will send a test message in 20 seconds.")
}

startBot()
