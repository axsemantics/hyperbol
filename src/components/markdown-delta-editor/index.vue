<template lang="pug">
.c-markdown-delta-editor(@mousedown.stop="handleMousedown")
	.content(ref="content") {{ text }}
	caret(:is-focused="selection.isFocused", :selection-positions="selectionPositions")
	textarea(
		ref="textarea"
		@focus="handleFocus",
		@blur="handleBlur",
		@input="handleInput",
		@keydown="handleKeydown"
	)
</template>
<script>
import { Delta, DeltaString } from 'quidditch'
import { caretPositionFromPoint, getDeltaTextLength } from 'lib/utils'

import Caret from './caret'

const getNodePathFragmentLength = function (node) {
	if (!node.textContent)
		return 0
	return new DeltaString(node.textContent).length
}

export default {
	props: {
		ops: Array
	},
	components: { Caret },
	data () {
		return {
			selection: {
				isFocused: false,
				focusOffset: null,
				anchorOffset: null
			},
			selectionPositions: {
				focus: null,
				anchor: null
			}
		}
	},
	computed: {
		selectedRange () {
			const focusOffset = this.selection.focusOffset
			const anchorOffset = this.selection.anchorOffset
			if (anchorOffset <= focusOffset) {
				return {
					startOffset: anchorOffset,
					endOffset: focusOffset,
				}
			}
			return {
				startOffset: focusOffset,
				endOffset: anchorOffset,
			}
		},
		text () {
			return new Delta(this.ops).apply('')
		}
	},
	created () {},
	mounted () {
		document.addEventListener('mouseup', this.handleMouseup)
		document.addEventListener('mousemove', this.handleMousemove)
	},
	destroyed () {
		document.removeEventListener('mouseup', this.handleMouseup)
		document.removeEventListener('mousemove', this.handleMousemove)
	},
	watch: {
		selection: {
			deep: true,
			handler: 'updateSelectionPositions'
		}
	},
	methods: {
		focus () {
			this.selection.focusOffset = 0
			this.selection.anchorOffset = 0
			this.selection.isFocused = true
			this.$refs.textarea.focus({preventScroll: true})
		},
		handleFocus () {},
		handleBlur () {
			this.selection.isFocused = false
			this.$emit('blur')
		},
		handleInput () {
			const textarea = this.$refs.textarea
			if (textarea.value.length === 1) {
				const charcode = textarea.value.charCodeAt(0)
				// We have received a half surrogate. At least Cypress enters non-BMP
				// characters (aka Emoji) this way, and quidditch will reject the message.
				// Just wait for more.
				if (charcode >= 0xd800 && charcode <= 0xdfff) return
			}
			const range = this.selectedRange
			if (!range) return
			const delta = new Delta()
			const input = new DeltaString(textarea.value)
			delta.retain(range.startOffset)
			delta.delete(range.endOffset - range.startOffset)
			delta.insert(input)
			textarea.value = ''
			const newOffset = range.startOffset + input.length
			this.$emit('update', delta)
			this.$nextTick(() => {
				this.selection.focusOffset = newOffset
				this.selection.anchorOffset = newOffset
			})
			textarea.value = ''
		},
		handleKeydown (event) {
			if (event.ctrlKey && ['I', 'B', 'U'].includes(event.key.toUpperCase())) {
				event.preventDefault()
				return
			}
			const shift = event.shiftKey
			const ctrl = event.ctrlKey
			switch (event.key) {
				case 'Delete':
				case 'Backspace': {
					event.preventDefault()
					let range = this.selectedRange
					if (!range) return
					const delta = new Delta()
					let newOffset
					const direction = event.key === 'Backspace' ? -1 : 0
					if (range.startOffset === range.endOffset) {
						if (event.key === 'Backspace' && range.startOffset <= 0) return
						if (event.key === 'Delete' && range.startOffset >= getDeltaTextLength(this.ops)) return
						delta.retain(range.startOffset + direction)
						delta.delete(1)
						newOffset = range.startOffset + direction
					} else {
						delta.retain(range.startOffset)
						delta.delete(range.endOffset - range.startOffset)
						newOffset = range.startOffset
					}
					this.$emit('update', delta)
					this.$nextTick(() => {
						this.selection.focusOffset = newOffset
						this.selection.anchorOffset = newOffset
					})
					break
				}
				case 'Escape':
					break
				case 'ArrowLeft': {
					event.preventDefault()
					if (this.selection.focusOffset <= 0) return
					let newPosition = this.selection.focusOffset - 1
					// TODO word bounds
					/* const text = prev ?? op?.insert */
					/* if (ctrl && text instanceof DeltaString) {
						if (offset === 0) offset = text.length // at the right border
						const bounds = findWordBounds(text, offset - 1)
						if (bounds?.start != null) newPosition += (bounds.start - offset + 1)
					} */
					this.selection.focusOffset = newPosition
					if (!shift) {
						this.selection.anchorOffset = newPosition
					}
					break
				}
				case 'ArrowRight': {
					event.preventDefault()
					if (this.selection.focusOffset >= this.text.length) return // TODO DeltaStringify?
					let newPosition = this.selection.focusOffset + 1
					this.selection.focusOffset = newPosition
					if (!shift) {
						this.selection.anchorOffset = newPosition
					}
					break
				}
			}
		},
		handleMousedown (event) {
			event.preventDefault()
			const {node, offset: partialOffset} = this.getCaretPositionFromEvent(event)
			let offset = this.findOffsetForNode(node, partialOffset)
			this.selection.focusOffset = offset
			this.selection.anchorOffset = offset
			this.selection.isFocused = true
			this.$refs.textarea.focus({preventScroll: true})
		},
		getCaretPositionFromEvent (event) {
			let node, offset
			const coords = {
				x: event.clientX,
				y: event.clientY
			}
			;({node, offset} = caretPositionFromPoint(coords))
			offset = new DeltaString(node.textContent).transformFromNativeIndex(offset)
			return {node, offset}
		},
		findOffsetForNode (targetNode, partialOffset) {
			let offset = partialOffset
			const rFunc = (node) => {
				if (!node || node.isSameNode(this.$el)) { // reached the top
					return
				}
				while (node.previousSibling) {
					node = node.previousSibling
					offset += getNodePathFragmentLength(node)
				}
				rFunc(node.parentNode)
			}
			rFunc(targetNode)
			return offset
		},
		updateSelectionPositions () {
			const rootElement = this.$refs.content
			const rootRect = rootElement.getBoundingClientRect()

			const focusCoords = this.getCoordinatesFromOffset(this.selection.focusOffset ?? 0)
			let focusPosition
			if (this.selection.focusOffset != null) {
				focusPosition = focusCoords.x - rootRect.x + rootElement.scrollLeft
			}

			let anchorPosition
			if (this.selection.focusOffset === this.selection.anchorOffset) {
				anchorPosition = focusPosition
			} else {
				const anchorCoords = this.getCoordinatesFromOffset(this.selection.anchorOffset ?? 0)
				anchorPosition = anchorCoords.x - rootRect.x + rootElement.scrollLeft
			}
			this.selectionPositions = {
				focus: focusPosition,
				anchor: anchorPosition,
				top: focusCoords.y - rootRect.y
			}
		},
		getCoordinatesFromOffset (selectionOffset) {
			let {node, offset} = this.findOffset(selectionOffset)
			const rootRect = this.$refs.content.getBoundingClientRect()
			let coords
			if (!node) {
				console.error('wtf')
				return
			} else {
				offset = offset > 0 ? new DeltaString(node.textContent).transformToNativeIndex(offset) : 0
				const focusRange = document.createRange()
				focusRange.setStart(node, offset)
				focusRange.setEnd(node, offset)
				const rect = focusRange.getClientRects()[0]
				if (rect) {
					coords = {
						x: rect.x + 8,
						y: rect.y + 8
					}
				}
			}
			if (!coords) {
				coords = {
					x: rootRect.x + 8,
					y: rootRect.y + 8
				}
			}
			return coords
		},
		findOffset (offset) {
			const childNodes = this.$refs.content.childNodes
			const rFunc = (nodes) => {
				for (let node of nodes) {
					const textLength = getNodePathFragmentLength(node)
					if (offset <= textLength) {
						if (node instanceof Text) {
							return node
						}
						return rFunc(node.childNodes)
					}
					offset -= textLength
				}
			}
			const node = rFunc(childNodes)
			return {node, offset}
		}
	}
}
</script>
<style src="./style.styl" lang="styl"/>
