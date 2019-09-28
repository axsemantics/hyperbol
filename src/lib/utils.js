import { OpIterator } from 'quidditch'

export function caretPositionFromPoint ({x, y}) {
	if (document.caretPositionFromPoint) {
		const range = document.caretPositionFromPoint(x, y)
		return {
			node: range.offsetNode,
			offset: range.offset
		}
	} else if (document.caretRangeFromPoint) {
		const range = document.caretRangeFromPoint(x, y)
		return {
			node: range.startContainer,
			offset: range.startOffset
		}
	}
}

export function getDeltaTextLength (ops) {
	const iter = new OpIterator(ops)
	let length = 0
	while (iter.hasNext()) {
		const op = iter.next()
		length += iter.getOpLength(op)
	}
	return length
}
