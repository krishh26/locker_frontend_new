import { Plus, RefreshCw, Edit, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { SampleAction } from '@/store/api/qa-sample-plan/types'
import { formatDisplayDate } from '../../../../utils/utils'

interface ActionsTableProps {
  actions: SampleAction[]
  isLoadingActions: boolean
  isDeletingAction: boolean
  deleteActionId: number | null
  planDetailId: string | number | null
  onRefresh: () => void
  onAddAction: () => void
  onEditAction: (action: SampleAction) => void
  onDeleteAction: (actionId: number) => void
  isReadOnly?: boolean
}

const getActionSummary = (action: SampleAction) => {
  return action.action_required && action.action_required.length > 50
    ? `${action.action_required.substring(0, 50)}...`
    : action.action_required || ''
}

export function ActionsTable({
  actions,
  isLoadingActions,
  isDeletingAction,
  deleteActionId,
  planDetailId,
  onRefresh,
  onAddAction,
  onEditAction,
  onDeleteAction,
  isReadOnly = false,
}: ActionsTableProps) {
  return (
    <div className='flex-1'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold'>Actions for Sample</h3>
        <div className='flex gap-2'>
          <Button variant='ghost' size='sm' onClick={onRefresh} disabled={isLoadingActions}>
            <RefreshCw className={`h-4 w-4 ${isLoadingActions ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={onAddAction}
            disabled={!planDetailId || isReadOnly}
            className='bg-green-600 hover:bg-green-700'
          >
            <Plus className='mr-2 h-4 w-4' />
            Add Action
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Summary</TableHead>
                <TableHead>Action Required</TableHead>
                <TableHead>Action With</TableHead>
                <TableHead>Target Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingActions ? (
                <TableRow>
                  <TableCell colSpan={5} className='text-center py-8'>
                    <div className='flex items-center justify-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      <span className='text-sm text-muted-foreground'>Loading actions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : actions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='text-center py-8 text-muted-foreground'>
                    There are no Actions on this Sample
                  </TableCell>
                </TableRow>
              ) : (
                actions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell>{getActionSummary(action)}</TableCell>
                    <TableCell>{action.action_required}</TableCell>
                    <TableCell>
                      {`${
                        (action.action_with as { first_name?: string; last_name?: string })
                          ?.first_name || ''
                      } ${
                        (action.action_with as { first_name?: string; last_name?: string })
                          ?.last_name || ''
                      }`.trim() || 'N/A'}
                    </TableCell>
                    <TableCell>{formatDisplayDate(action.target_date)}</TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        <Button 
                          variant='ghost' 
                          size='sm' 
                          onClick={() => onEditAction(action)}
                          disabled={isReadOnly}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => onDeleteAction(action.id)}
                          disabled={(isDeletingAction && deleteActionId === action.id) || isReadOnly}
                        >
                          <Trash2 className='h-4 w-4 text-destructive' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

