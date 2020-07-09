const { Plugin } = require('powercord/entities')
const { getModule, React } = require('powercord/webpack')
const { findInReactTree } = require('powercord/util')
const { inject, uninject } = require('powercord/injector')

module.exports = class InboxShowBlockedMessages extends Plugin {
    async startPlugin() {
        const BlockedMessages = await getModule(m => m.type && m.type.displayName == 'BlockedMessages')
        const UnreadChannelMessages = await getModule(m => m.default && m.default.displayName == 'UnreadChannelMessages')
        inject('inbox-show-blocked-messages', UnreadChannelMessages, 'default', ([{ channel }], res) => {
            for (let i = 0; i < res.props.children.length; i++) {
                const m = res.props.children[i], msg = channel.messages.find(msg => msg.id == m.key)
                if (!msg || !msg.blocked) continue
                if (i > 0) {
                    const j = res.props.children[i - 1].props.__group !== undefined ? res.props.children[i - 1].props.__group : i - 1
                    const e = findInReactTree(res.props.children[j], e => e.type && e.type.type && e.type.type.displayName == 'BlockedMessages')
                    if (e) {
                        const { content } = e.props.messages
                        content.push({ content: msg, groupId: content[content.length - 1].content.author.id == msg.author.id ? null : msg.id, type: 'MESSAGE' })
                        res.props.children[i] = React.createElement(() => null, { __group: j })
                        continue
                    }
                }
                const { props } = m.props.children[1]
                m.props.children[1] = React.createElement(BlockedMessages, {
                    channel: props.channel,
                    compact: props.compact,
                    listItemProps: { onFocus: () => {} },
                    registerDOMNode: () => {},
                    messages: {
                        content: [{ content: msg, groupId: msg.id, type: 'MESSAGE' }]
                    }
                })
            }
            return res
        })
        UnreadChannelMessages.default.displayName = 'UnreadChannelMessages'
    }

    pluginWillUnload() {
        uninject('inbox-show-blocked-messages')
    }
}
