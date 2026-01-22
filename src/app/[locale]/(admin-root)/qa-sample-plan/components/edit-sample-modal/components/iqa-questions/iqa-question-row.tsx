import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  TableCell,
  TableRow,
} from '@/components/ui/table'
import type { SampleQuestion } from '@/store/api/qa-sample-plan/types'

interface IqaQuestionRowProps {
  question: SampleQuestion
  onAnswerChange: (id: string, answer: 'Yes' | 'No') => void
  onDeleteQuestion: (id: string) => void
  isReadOnly?: boolean
}

export function IqaQuestionRow({
  question,
  onAnswerChange,
  onDeleteQuestion,
  isReadOnly = false,
}: IqaQuestionRowProps) {
  const answer = question.answer || ''

  const handleAnswerSelect = (selectedAnswer: 'Yes' | 'No') => {
    onAnswerChange(String(question.id), selectedAnswer)
  }

  return (
    <TableRow key={question.id}>
      <TableCell>
        <p className='text-sm py-1'>{question.question_text}</p>
      </TableCell>
      <TableCell colSpan={2}>
        <RadioGroup
          value={answer}
          onValueChange={(value) => handleAnswerSelect(value as 'Yes' | 'No')}
          className='flex flex-row justify-center gap-8'
          disabled={isReadOnly}
        >
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='Yes' id={`yes-${question.id}`} disabled={isReadOnly} />
            <Label htmlFor={`yes-${question.id}`} className={isReadOnly ? '' : 'cursor-pointer'}>
              Yes
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='No' id={`no-${question.id}`} disabled={isReadOnly} />
            <Label htmlFor={`no-${question.id}`} className={isReadOnly ? '' : 'cursor-pointer'}>
              No
            </Label>
          </div>
        </RadioGroup>
      </TableCell>
      <TableCell className='text-center'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => onDeleteQuestion(String(question.id))}
          disabled={isReadOnly}
        >
          <Trash2 className='h-4 w-4 text-destructive' />
        </Button>
      </TableCell>
    </TableRow>
  )
}

