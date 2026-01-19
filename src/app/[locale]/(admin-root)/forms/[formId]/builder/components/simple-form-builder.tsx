'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { SimpleFormField } from '@/store/api/forms/types'
import { ComponentItem } from './component-item'
import { PresetItem } from './preset-item'
import { FormFieldCard } from './form-field-card'

// Simple UUID generator
function uuidv4(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const SIMPLE_COMPONENTS = [
  { type: 'text', label: '📝 Text Input', icon: '📝' },
  { type: 'email', label: '📧 Email', icon: '📧' },
  { type: 'phone', label: '📞 Phone', icon: '📞' },
  { type: 'number', label: '🔢 Number', icon: '🔢' },
  { type: 'textarea', label: '📄 Long Text', icon: '📄' },
  { type: 'select', label: '📋 Dropdown', icon: '📋' },
  { type: 'radio', label: '🔘 Multiple Choice', icon: '🔘' },
  { type: 'checkbox', label: '☑️ Checkboxes', icon: '☑️' },
  { type: 'date', label: '📅 Date', icon: '📅' },
  { type: 'file', label: '📎 File Upload', icon: '📎' },
  { type: 'signature', label: '✍️ Signature', icon: '✍️' },
]

interface SimpleFormBuilderProps {
  initialFields?: SimpleFormField[]
  onChange?: (fields: SimpleFormField[]) => void
}

export function SimpleFormBuilder({
  initialFields = [],
  onChange,
}: SimpleFormBuilderProps) {
  const [formFields, setFormFields] = useState<SimpleFormField[]>(initialFields)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'components' | 'presets'>(
    'components'
  )
  const [isDraggingFromPalette, setIsDraggingFromPalette] = useState(false)

  useEffect(() => {
    setFormFields(initialFields)
  }, [initialFields])

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source } = result

      // If dropped outside a droppable area
      if (!destination) {
        return
      }

      // If dropped in the same position
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return
      }

      // Reordering fields within the form area
      if (
        source.droppableId === 'form-area' &&
        destination.droppableId === 'form-area'
      ) {
        const newFields = Array.from(formFields)
        const [reorderedField] = newFields.splice(source.index, 1)
        newFields.splice(destination.index, 0, reorderedField)
        setFormFields(newFields)
        onChange?.(newFields)
      }
    },
    [formFields, onChange]
  )

  const handlePaletteDragStart = useCallback(() => {
    setIsDraggingFromPalette(true)
  }, [])

  const handlePaletteDragEnd = useCallback(() => {
    setIsDraggingFromPalette(false)
  }, [])

  const handleFormAreaDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDraggingFromPalette(false)

      const componentType = e.dataTransfer.getData('application/component-type')
      const presetData = e.dataTransfer.getData('application/preset-field')

      const getDefaultLabel = (type: string): string => {
        const labels: Record<string, string> = {
          text: 'Full Name',
          email: 'Email Address',
          phone: 'Phone Number',
          number: 'Age',
          textarea: 'Comments',
          select: 'Select Option',
          radio: 'Choose One',
          checkbox: 'Select All That Apply',
          date: 'Date',
          file: 'Upload File',
          signature: 'Signature',
        }
        return labels[type] || 'Field Label'
      }

      const getDefaultPlaceholder = (type: string): string => {
        const placeholders: Record<string, string> = {
          text: 'Enter your full name',
          email: 'your.email@example.com',
          phone: '+1 (555) 123-4567',
          number: 'Enter a number',
          textarea: 'Type your message here...',
          date: 'Select date',
          file: 'Choose file to upload',
        }
        return placeholders[type] || 'Enter value'
      }

      const needsOptions = (type: string): boolean =>
        ['select', 'radio', 'checkbox'].includes(type)

      let newField: SimpleFormField | null = null

      if (presetData) {
        try {
          const presetField = JSON.parse(presetData) as SimpleFormField
          newField = {
            ...presetField,
            id: uuidv4(),
          }
        } catch (error) {
          console.error('Error parsing preset data:', error)
          return
        }
      } else if (componentType) {
        newField = {
          id: uuidv4(),
          type: componentType,
          label: getDefaultLabel(componentType),
          placeholder: getDefaultPlaceholder(componentType),
          required: false,
          width: 'full',
          ...(needsOptions(componentType) && {
            options: [
              { label: 'Option 1', value: 'option_1' },
              { label: 'Option 2', value: 'option_2' },
              { label: 'Option 3', value: 'option_3' },
            ],
          }),
        }
      }

      if (newField) {
        const updatedFields = [...formFields, newField]
        setFormFields(updatedFields)
        onChange?.(updatedFields)
        setEditingField(newField.id)
      }
    },
    [formFields, onChange]
  )

  const handleFormAreaDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    },
    []
  )

  const updateField = useCallback(
    (fieldId: string, updates: Partial<SimpleFormField>) => {
      const updatedFields = formFields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
      setFormFields(updatedFields)
      onChange?.(updatedFields)
    },
    [formFields, onChange]
  )

  const deleteField = useCallback(
    (fieldId: string) => {
      const updatedFields = formFields.filter((field) => field.id !== fieldId)
      setFormFields(updatedFields)
      onChange?.(updatedFields)
      setEditingField(null)
    },
    [formFields, onChange]
  )

  const duplicateField = useCallback(
    (fieldId: string) => {
      const fieldToDuplicate = formFields.find((f) => f.id === fieldId)
      if (fieldToDuplicate) {
        const newField: SimpleFormField = {
          ...fieldToDuplicate,
          id: uuidv4(),
          label: `${fieldToDuplicate.label} (Copy)`,
        }
        const fieldIndex = formFields.findIndex((f) => f.id === fieldId)
        const updatedFields = [
          ...formFields.slice(0, fieldIndex + 1),
          newField,
          ...formFields.slice(fieldIndex + 1),
        ]
        setFormFields(updatedFields)
        onChange?.(updatedFields)
      }
    },
    [formFields, onChange]
  )

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className='flex h-full gap-4 bg-muted/30'>
        {/* Component Palette */}
        <Card className='w-72 shrink-0'>
          <CardContent className='p-4'>
            {/* Tab Toggle */}
            <div className='flex items-center justify-between mb-4'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setActiveTab('components')}
                disabled={activeTab === 'components'}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <h3 className='text-sm font-semibold'>
                {activeTab === 'components' ? '📦 Components' : '✨ Presets'}
              </h3>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setActiveTab('presets')}
                disabled={activeTab === 'presets'}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>

            <p className='text-xs text-muted-foreground mb-4 text-center'>
              {activeTab === 'components'
                ? 'Drag components to build your form'
                : 'Choose from saved presets'}
            </p>

            <ScrollArea className='h-full'>
              <div className='space-y-2'>
                {activeTab === 'components' ? (
                  SIMPLE_COMPONENTS.map((item) => (
                    <ComponentItem
                      key={item.type}
                      component={item}
                      onDragStart={handlePaletteDragStart}
                      onDragEnd={handlePaletteDragEnd}
                    />
                  ))
                ) : (
                  <PresetItem
                    onDragStart={handlePaletteDragStart}
                    onDragEnd={handlePaletteDragEnd}
                  />
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Form Area */}
        <div className='flex-1 h-full min-w-0'>
          <Card className='h-full flex flex-col'>
            <CardContent className='p-6 flex flex-col flex-1 min-h-0'>
              <div className='mb-4 shrink-0'>
                <h3 className='text-lg font-semibold'>🎨 Form Builder</h3>
                <p className='text-sm text-muted-foreground'>
                  Drag components here to create your form
                </p>
              </div>

              <div className='flex-1 min-h-0'>
                <FormArea
                  fields={formFields}
                  editingField={editingField}
                  onFieldEdit={setEditingField}
                  onFieldUpdate={updateField}
                  onFieldDelete={deleteField}
                  onFieldDuplicate={duplicateField}
                  onDrop={handleFormAreaDrop}
                  onDragOver={handleFormAreaDragOver}
                  isDraggingFromPalette={isDraggingFromPalette}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DragDropContext>
  )
}

interface FormAreaProps {
  fields: SimpleFormField[]
  editingField: string | null
  onFieldEdit: (fieldId: string | null) => void
  onFieldUpdate: (fieldId: string, updates: Partial<SimpleFormField>) => void
  onFieldDelete: (fieldId: string) => void
  onFieldDuplicate: (fieldId: string) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  isDraggingFromPalette: boolean
}

function FormArea({
  fields,
  editingField,
  onFieldEdit,
  onFieldUpdate,
  onFieldDelete,
  onFieldDuplicate,
  onDrop,
  onDragOver,
  isDraggingFromPalette,
}: FormAreaProps) {
  if (fields.length === 0) {
    return (
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className={`h-full min-h-0 rounded-lg border-2 border-dashed p-12 flex flex-col items-center justify-center transition-colors ${
          isDraggingFromPalette
            ? 'border-primary bg-primary/5'
            : 'border-muted bg-muted/20'
        }`}
      >
        <div className='text-6xl mb-4'>🎯</div>
        <h4 className='text-lg font-semibold mb-2'>
          Drop form components here
        </h4>
        <p className='text-sm text-muted-foreground text-center max-w-md'>
          Drag any component from the left panel to start building your form.
        </p>
      </div>
    )
  }

  return (
    <Droppable droppableId='form-area'>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          onDrop={onDrop}
          onDragOver={onDragOver}
          className={`h-full min-h-0 rounded-lg border-2 border-dashed p-6 pb-24 space-y-4 transition-colors overflow-y-auto ${
            snapshot.isDraggingOver || isDraggingFromPalette
              ? 'border-primary bg-primary/5'
              : 'border-muted'
          }`}
        >
          {fields.map((field, index) => (
            <Draggable key={field.id} draggableId={field.id} index={index}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={`transition-all ${
                    snapshot.isDragging
                      ? 'opacity-50 scale-95 shadow-lg'
                      : 'opacity-100'
                  }`}
                >
                  <FormFieldCard
                    field={field}
                    isEditing={editingField === field.id}
                    onEdit={() => onFieldEdit(field.id)}
                    onStopEdit={() => onFieldEdit(null)}
                    onUpdate={(updates) => onFieldUpdate(field.id, updates)}
                    onDelete={() => onFieldDelete(field.id)}
                    onDuplicate={() => onFieldDuplicate(field.id)}
                  />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}
