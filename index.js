const { Plugin } = require('powercord/entities')
const { getModule, getModuleByDisplayName, React } = require('powercord/webpack')
const { findInReactTree } = require('powercord/util')
const { inject, uninject } = require('powercord/injector')

module.exports = class InboxShowBlockedMessages extends Plugin {
    async startPlugin() {
        const classes = await getModule(['jumpButton', 'messages'])
        const JumpToMessageButton = await getModuleByDisplayName('JumpToMessageButton')
        const BlockedMessages = await getModule(m => m.type && m.type.displayName === 'BlockedMessages')
        const UnreadChannelMessages = await getModule(m => m.default && m.default.displayName === 'UnreadChannelMessages')
        inject('inbox-show-blocked-messages', UnreadChannelMessages, 'default', ([{ channel }], res) => {
            let j = res.props.children.length
            for (let i = 0; i < j; i++) {
                const m = res.props.children[i], msg = channel.messages.find(msg => msg.id == m.key)
                if (!msg || !msg.blocked) continue
                if (i > 0) {
                    const e = findInReactTree(res.props.children[i - 1], e => e?.type?.type?.displayName === 'BlockedMessages')
                    if (e) {
                        const { content } = e.props.messages
                        content.push({ content: msg, groupId: content[content.length - 1].content.author.id == msg.author.id ? null : msg.id, type: 'MESSAGE' })
                        res.props.children.splice(i, 1)
                        i--
                        j--
                        continue
                    }
                }
                res.props.children[i] = React.createElement('div', { className: classes.messageContainer },
                    React.createElement(JumpToMessageButton, {
                        className: classes.jumpButton,
                        guildId: m.props.channel.guild_id,
                        message: m.props.message
                    }),
                    React.createElement(BlockedMessages, {
                        channel: m.props.channel,
                        compact: m.props.compact,
                        listItemProps: { onFocus: () => {} },
                        registerDOMNode: () => {},
                        messages: {
                            content: [{ content: msg, groupId: msg.id, type: 'MESSAGE' }]
                        }
                    })
                )
            }
            return res
        })
        UnreadChannelMessages.default.displayName = 'UnreadChannelMessages'
    }

    pluginWillUnload() {
        uninject('inbox-show-blocked-messages')
    }
}
