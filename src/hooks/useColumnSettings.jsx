import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { Button, Modal, Space, Typography, Checkbox } from 'antd'
import { MenuOutlined, SettingOutlined } from '@ant-design/icons'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const { Text } = Typography

const getColumnKey = (col, index) => col.dataIndex ?? col.key ?? `col_${index}`

const loadOrder = (storageKey, columns) => {
  if (typeof window === 'undefined') return columns.map(getColumnKey)
  try {
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return columns.map(getColumnKey)
    const parsed = JSON.parse(saved)
    if (parsed?.order && Array.isArray(parsed.order)) {
      const allKeys = columns.map((col, i) => getColumnKey(col, i))
      const existing = parsed.order.filter(key => allKeys.includes(key))
      const missing = allKeys.filter(key => !existing.includes(key))
      return [...existing, ...missing]
    }
  } catch {
    // ignore
  }
  return columns.map(getColumnKey)
}

const loadHidden = (storageKey) => {
  if (typeof window === 'undefined') return []
  try {
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed?.hidden)) return parsed.hidden
  } catch {
    // ignore
  }
  return []
}

const saveSettings = (storageKey, order, hidden) => {
  if (typeof window === 'undefined') return
  try {
    const payload = { order, hidden }
    window.localStorage.setItem(storageKey, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

const useColumnSettings = (storageKey, columns) => {
  const [order, setOrder] = useState(() => loadOrder(storageKey, columns))
  const [hidden, setHidden] = useState(() => loadHidden(storageKey))
  const [open, setOpen] = useState(false)
  const [draftOrder, setDraftOrder] = useState([])
  const [draftHidden, setDraftHidden] = useState([])

  // Инициализируем draft при монтировании и обновлении
  useEffect(() => {
    setDraftOrder(order)
    setDraftHidden(hidden)
  }, [order, hidden])

  // Обработчик открытия модалки
  const handleOpenModal = useCallback(() => {
    setOpen(true)
    setDraftOrder(order)
    setDraftHidden(hidden)
  }, [order, hidden])

  const orderedColumns = useMemo(() => {
    const keyToColumn = new Map()
    columns.forEach((col, index) => {
      keyToColumn.set(getColumnKey(col, index), col)
    })
    const result = []
    order.forEach((key) => {
      const col = keyToColumn.get(key)
      if (col && !hidden.includes(key)) result.push(col)
    })
    // Добавляем новые ключи, которые не попали в order
    columns.forEach((col, index) => {
      const key = getColumnKey(col, index)
      if (!order.includes(key) && !hidden.includes(key)) {
        result.push(col)
      }
    })
    return result
  }, [columns, order, hidden])

  // Компонент модального окна
  const ColumnSettingsModal = () => {
    // Локальное состояние для модалки
    const [localOrder, setLocalOrder] = useState(order)
    const [localHidden, setLocalHidden] = useState(hidden)

    // Синхронизируем при открытии
    useEffect(() => {
      if (open) {
        const timer = requestAnimationFrame(() => {
          setLocalOrder(order)
          setLocalHidden(hidden)
        })
        return () => cancelAnimationFrame(timer)
      }
    }, [open, order, hidden])

    if (!open) return null

    const handleModalDragEnd = (result) => {
      if (!result.destination) return
      const fromIndex = result.source.index
      const toIndex = result.destination.index
      if (fromIndex === toIndex) return

      setLocalOrder((prev) => {
        const next = [...prev]
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        return next
      })
    }

    const handleToggleVisibility = (key, checked) => {
      setLocalHidden((prev) =>
        checked ? prev.filter((h) => h !== key) : [...prev, key]
      )
    }

    const handleModalSubmit = () => {
      const allKeys = columns.map((col, i) => getColumnKey(col, i))
      const existingOrder = localOrder.filter((key) => allKeys.includes(key))
      const missingOrder = allKeys.filter((key) => !existingOrder.includes(key) && !localHidden.includes(key))
      const nextOrder = [...existingOrder, ...missingOrder]
      const nextHidden = localHidden.filter((key) => allKeys.includes(key))

      setOrder(nextOrder)
      setHidden(nextHidden)
      saveSettings(storageKey, nextOrder, nextHidden)
      setOpen(false)
    }

    return (
      <Modal
        title="Настройка порядка столбцов"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleModalSubmit}
        okText="Готово"
        cancelText="Отмена"
        destroyOnClose={false}
        maskClosable={false}
      >
        <Text type="secondary">
          Перетаскивайте элементы, чтобы изменить порядок столбцов. Отмечайте чекбоксы для скрытия/показа.
        </Text>
        <div style={{ marginTop: 16 }}>
          <DragDropContext onDragEnd={handleModalDragEnd}>
            <Droppable droppableId="column-settings-droppable">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {localOrder.map((key, index) => {
                    const col = columns.find((c, i) => getColumnKey(c, i) === key)
                    if (!col) return null

                    return (
                      <Draggable key={key} draggableId={key} index={index}>
                        {(dragProvided, snapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 4,
                              border: '1px solid #f0f0f0',
                              background: snapshot.isDragging ? '#e6f4ff' : '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              ...dragProvided.draggableProps.style,
                            }}
                          >
                            <Space>
                              <div {...dragProvided.dragHandleProps} style={{ cursor: 'grab' }}>
                                <MenuOutlined style={{ color: '#999' }} />
                              </div>
                              <Checkbox
                                checked={!localHidden.includes(key)}
                                onChange={(e) => handleToggleVisibility(key, e.target.checked)}
                              >
                                {col.title}
                              </Checkbox>
                            </Space>
                          </div>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </Modal>
    )
  }

  const ColumnSettingsButton = () => (
    <>
      <Button icon={<SettingOutlined />} onClick={handleOpenModal}>
        Настроить столбцы
      </Button>
      <ColumnSettingsModal />
    </>
  )

  return { orderedColumns, ColumnSettingsButton }
}

export default useColumnSettings