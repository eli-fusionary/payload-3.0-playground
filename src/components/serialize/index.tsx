/* eslint-disable react/no-array-index-key */
import React, { Fragment } from 'react'

import type { SerializedListItemNode, SerializedListNode } from '@lexical/list'
import type { SerializedHeadingNode } from '@lexical/rich-text'
import type {
  LinkFields,
  SerializedLinkNode,
} from '@payloadcms/richtext-lexical'
import type {
  SerializedElementNode,
  SerializedLexicalNode,
  SerializedTextNode,
} from 'lexical'
import Link from 'next/link'
import { Heading } from 'ui/static'

import { Label } from '../Label'
import { LargeBody } from '../LargeBody'

import { IS_BOLD, IS_ITALIC, IS_STRIKETHROUGH } from './nodeFormat'

type Props = {
  nodes: SerializedLexicalNode[]
}

export function serializeLexical({ nodes }: Props): JSX.Element {
  return (
    <>
      {nodes.map((_node, index): JSX.Element | null => {
        if (_node.type === 'text') {
          const node = _node as SerializedTextNode
          let text = (
            <span dangerouslySetInnerHTML={{ __html: node.text }} key={index} />
          )
          if (node.format & IS_BOLD) {
            text = <strong key={index}>{text}</strong>
          }
          if (node.format & IS_ITALIC) {
            text = <em key={index}>{text}</em>
          }
          if (node.format & IS_STRIKETHROUGH) {
            text = (
              <span key={index} style={{ textDecoration: 'line-through' }}>
                {text}
              </span>
            )
          }

          return text
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (_node == null) {
          return null
        }

        // NOTE: Hacky fix for
        // https://github.com/facebook/lexical/blob/d10c4e6e55261b2fdd7d1845aed46151d0f06a8c/packages/lexical-list/src/LexicalListItemNode.ts#L133
        // which does not return checked: false (only true - i.e. there is no prop for false)
        const serializedChildrenFn = (
          node: SerializedElementNode,
        ): JSX.Element | null => {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (node.children == null || node.children.length === 0) {
            return <br key={index} />
          } else if (
            node.type === 'list' &&
            (node as SerializedListNode).listType === 'check'
          ) {
            for (const item of node.children) {
              if ('checked' in item) {
                if (!item.checked) {
                  item.checked = false
                }
              }
            }
            return serializeLexical({ nodes: node.children })
          } else {
            return serializeLexical({ nodes: node.children })
          }
        }

        const serializedChildren =
          'children' in _node
            ? serializedChildrenFn(_node as SerializedElementNode)
            : ''

        const serializedNode = _node as SerializedElementNode
        switch (_node.type) {
          case 'paragraph': {
            return (
              <p
                key={index}
                style={{
                  textAlign: serializedNode.format
                    ? `${serializedNode.format}`
                    : undefined,
                }}
              >
                {serializedChildren}
              </p>
            )
          }
          case 'heading': {
            const node = _node as SerializedHeadingNode
            return (
              <Heading
                key={index}
                as={node.tag}
                style={{
                  textAlign: serializedNode.format
                    ? `${serializedNode.format}`
                    : undefined,
                }}
              >
                {serializedChildren}
              </Heading>
            )
          }
          case 'label':
            return <Label key={index}>{serializedChildren}</Label>

          case 'largeBody': {
            return <LargeBody key={index}>{serializedChildren}</LargeBody>
          }
          case 'list': {
            const node = _node as SerializedListNode

            type List = Extract<keyof JSX.IntrinsicElements, 'ol' | 'ul'>
            const Tag = node.tag as List
            return (
              <Tag className={node.listType} key={index}>
                {serializedChildren}
              </Tag>
            )
          }
          case 'listitem': {
            const node = _node as SerializedListItemNode

            // eslint-disable-next-line no-negated-condition
            if (node.checked != null) {
              return (
                <li
                  aria-checked={node.checked ? 'true' : 'false'}
                  className={`component--list-item-checkbox ${
                    node.checked
                      ? 'component--list-item-checkbox-checked'
                      : 'component--list-item-checked-unchecked'
                  }`}
                  key={index}
                  // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
                  role="checkbox"
                  tabIndex={-1}
                  value={node.value}
                >
                  {serializedChildren}
                </li>
              )
            } else {
              return (
                <li key={index} value={node.value}>
                  {serializedChildren}
                </li>
              )
            }
          }
          case 'quote': {
            return <blockquote key={index}>{serializedChildren}</blockquote>
          }
          case 'link': {
            const node = _node as SerializedLinkNode

            const fields: LinkFields = node.fields

            if (fields.linkType === 'custom') {
              return (
                <Link
                  href={fields.url}
                  key={index}
                  className="underline"
                  {...(fields.newTab
                    ? {
                        rel: 'noopener noreferrer',
                        target: '_blank',
                      }
                    : {})}
                >
                  {serializedChildren}
                </Link>
              )
            } else {
              return <span key={index}>Internal link coming soon</span>
            }
          }

          default:
            return null
        }
      })}
    </>
  )
}
