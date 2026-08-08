import type { HTMLAttributes, ReactNode } from 'react'
import { Children, createElement, isValidElement } from 'react'

interface IHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level: 2 | 3
}

function Heading({ children, id, level, ...props }: IHeadingProps) {
  function textFromNode(node: ReactNode): string {
    return Children.toArray(node)
      .map((child) => {
        if (typeof child === 'string' || typeof child === 'number') return String(child)
        if (isValidElement<{ children?: ReactNode }>(child))
          return textFromNode(child.props.children)
        return ''
      })
      .join('')
  }

  function slug(value: string): string {
    return (
      value
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
        .trim()
        .replace(/[\s-]+/g, '-') || 'section'
    )
  }

  return createElement(`h${level}`, { ...props, id: id ?? slug(textFromNode(children)) }, children)
}

export function MdxHeading2(props: HTMLAttributes<HTMLHeadingElement>) {
  return <Heading {...props} level={2} />
}

export function MdxHeading3(props: HTMLAttributes<HTMLHeadingElement>) {
  return <Heading {...props} level={3} />
}
