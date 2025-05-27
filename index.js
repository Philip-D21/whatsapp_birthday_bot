const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const fs = require('fs')
const schedule = require('node-schedule')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const axios = require('axios')

async function startBot() {
    // Use multi-file auth state for better reliability + plus you wouldn't be scanning qr code every time
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    
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
            
            // // Test command
            // if (messageContent.toLowerCase() === '!test') {
            //     await sock.sendMessage(sender, { text: '✅ Bot is working! You will receive birthday messages at 9 AM daily.' })
            // }

            // // Get current group info command
            // if (messageContent.toLowerCase() === '!groupid' && isGroup) {
            //     try {
            //         const groupInfo = await sock.groupMetadata(sender)
            //         let message = '📱 Current Group Information:\n\n'
            //         message += `Group Name: ${groupInfo.subject}\n`
            //         message += `Group ID: ${groupInfo.id}\n`
            //         message += `Created: ${new Date(groupInfo.creation * 1000).toLocaleDateString()}\n`
            //         message += `Members: ${groupInfo.participants.length}\n\n`
            //         message += 'To use this group for birthday messages, add this ID to birthdays.json:\n'
            //         message += `"group": "${groupInfo.id}"`
                    
            //         await sock.sendMessage(sender, { text: message })
            //     } catch (error) {
            //         console.error('Error fetching group info:', error)
            //         await sock.sendMessage(sender, { 
            //             text: '❌ Error fetching group information. Please try again later.' 
            //         })
            //     }
            // }

            // // Get all groups command
            // if (messageContent.toLowerCase() === '!groups') {
            //     try {
            //         const groups = await sock.groupFetchAllParticipating()
            //         let message = '📱 Groups the bot is in:\n\n'
                    
            //         for (const group of Object.values(groups)) {
            //             message += `Group Name: ${group.subject}\n`
            //             message += `Group ID: ${group.id}\n`
            //             message += `Members: ${group.participants.length}\n`
            //             message += '-------------------\n'
            //         }
                    
            //         await sock.sendMessage(sender, { text: message })
            //     } catch (error) {
            //         console.error('Error fetching groups:', error)
            //         await sock.sendMessage(sender, { 
            //             text: '❌ Error fetching groups. Please try again later.' 
            //         })
            //     }
            // }

            // // Get group info command
            // if (messageContent.toLowerCase().startsWith('!groupinfo')) {
            //     try {
            //         const groupId = messageContent.split(' ')[1]
            //         if (!groupId) {
            //             await sock.sendMessage(sender, { 
            //                 text: '❌ Please provide a group ID. Usage: !groupinfo <group-id>' 
            //             })
            //             return
            //         }

            //         console.log(groupId)

            //         const groupInfo = await sock.groupMetadata(groupId)
            //         let message = '📱 Group Information:\n\n'
            //         message += `Name: ${groupInfo.subject}\n`
            //         message += `ID: ${groupInfo.id}\n`
            //         message += `Created: ${new Date(groupInfo.creation * 1000).toLocaleDateString()}\n`
            //         message += `Members: ${groupInfo.participants.length}\n`
            //         message += '\nParticipants:\n'

            //         console.log(groupInfo.participants)
                    
            //         for (const participant of groupInfo.participants) {
            //             message += `- ${participant.id}\n`
            //         }

            //         await sock.sendMessage(sender, { text: message })
            //     } catch (error) {
            //         console.error('Error fetching group info:', error)
            //         await sock.sendMessage(sender, { 
            //             text: '❌ Error fetching group information. Please check the group ID and try again.' 
            //         })
            //     }
            // }
        }
    })

    // Save credentials whenever they are updated
    sock.ev.on('creds.update', saveCreds)


    // see available groups joined
    // sock.ev.on('connection.update', async (update) => {
    //     const { connection } = update
    //     if (connection === 'open') {
    //         console.log('✅ Connected! Fetching joined groups...')
    
    //         try {
    //             const groups = await sock.groupFetchAllParticipating()
    //             console.log('📋 Joined Groups:')
    //             Object.entries(groups).forEach(([id, group]) => {
    //                 console.log(`- ${group.subject} | ID: ${id}`)
    //             })
    //         } catch (error) {
    //             console.error('❌ Failed to fetch group list:', error)
    //         }
    //     }
    // })

    // Schedule job to run in 20 seconds
    const date = new Date()
    date.setSeconds(date.getSeconds() + 5)

    console.log(date)
    
    schedule.scheduleJob(date, async () => {
        try {
            const birthdays = JSON.parse(fs.readFileSync('birthdays.json'))
            const today = new Date().toISOString().slice(5, 10)
    
            for (const person of birthdays) {
                if (person.date === today) {
                    const mentionJid = person.jid // e.g., '1234567890@s.whatsapp.net'
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
    console.log("📝 Available commands:")
    console.log("   - !test - Test if the bot is working")
    console.log("   - !groups - List all groups the bot is in")
    console.log("   - !groupid - Get the current group's ID (use in a group)")
    console.log("   - !groupinfo <group-id> - Get detailed information about a specific group")
}

startBot()
