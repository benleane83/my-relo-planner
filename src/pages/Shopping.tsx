import { useMemo, useState } from 'react';
import { useConfig, useShopping, useDeleteShoppingItem } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react';
import type { ShoppingItem } from '@/types';
import ShoppingItemDialog from '@/components/dialogs/ShoppingItemDialog';
import BudgetDialog from '@/components/dialogs/BudgetDialog';

const statusVariant = (status: string) => {
  switch (status) {
    case 'purchased':
      return 'default' as const;
    case 'shipped':
      return 'secondary' as const;
    case 'researching':
      return 'outline' as const;
    default:
      return 'outline' as const;
  }
};

export default function Shopping() {
  const { data: config, isLoading: configLoading } = useConfig();
  const { data: shopping, isLoading: shoppingLoading } = useShopping();
  const deleteMutation = useDeleteShoppingItem();

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ShoppingItem | null>(null);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);

  const budgetSummary = useMemo(() => {
    if (!shopping || !config) return null;

    const totalEstimated = shopping.items.reduce((sum, i) => sum + i.estimatedCost * i.quantity, 0);
    const totalActual = shopping.items.reduce((sum, i) => sum + (i.actualCost || 0) * i.quantity, 0);
    const budgetTotal = shopping.budget.total;

    // Per-category breakdown
    const categories = Object.entries(shopping.budget.categories).map(([name, limit]) => {
      const items = shopping.items.filter((i) => i.category === name);
      const spent = items.reduce((sum, i) => sum + (i.actualCost || 0) * i.quantity, 0);
      return { name, limit: limit as number, spent, pct: (limit as number) > 0 ? (spent / (limit as number)) * 100 : 0 };
    });

    return {
      totalEstimated,
      totalActual,
      budgetTotal,
      pct: budgetTotal ? (totalActual / budgetTotal) * 100 : 0,
      categories,
    };
  }, [shopping, config]);

  const isLoading = configLoading || shoppingLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold tracking-tight">Shopping</h2>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight">Shopping</h2>

      {/* Budget Summary */}
      {budgetSummary && config && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Budget Overview</CardTitle>
                <CardDescription>
                  {config.originCurrency} / {config.destinationCurrency} (rate: {config.conversionRate})
                </CardDescription>
              </div>
              <Button variant="outline" size="xs" onClick={() => setBudgetDialogOpen(true)}>
                <PencilIcon /> Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Spend</span>
                <span className="font-medium">
                  {budgetSummary.totalActual.toLocaleString()} / {budgetSummary.budgetTotal.toLocaleString()} {config.originCurrency}
                </span>
              </div>
              <Progress value={Math.min(budgetSummary.pct, 100)} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  ≈ {(budgetSummary.totalActual * config.conversionRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} {config.destinationCurrency} spent
                </span>
                <span>
                  ≈ {(budgetSummary.budgetTotal * config.conversionRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} {config.destinationCurrency} budget
                </span>
              </div>
            </div>

            <Separator />

            {/* Per-category mini bars */}
            <div className="grid gap-3 md:grid-cols-2">
              {budgetSummary.categories.map((cat) => (
                <div key={cat.name} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize font-medium">{cat.name}</span>
                    <span className="text-muted-foreground">
                      {cat.spent.toLocaleString()} / {cat.limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={Math.min(cat.pct, 100)} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      {shopping && config && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Items</CardTitle>
                <CardDescription>{shopping.items.length} items tracked</CardDescription>
              </div>
              <Button size="sm" onClick={() => { setEditItem(null); setItemDialogOpen(true); }}>
                <PlusIcon /> New Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Estimated</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {shopping.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.item}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {(item.estimatedCost * item.quantity).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.actualCost ? (item.actualCost * item.quantity).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell>{item.currency}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(item.status)} className="text-xs">
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.store || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon-xs" onClick={() => { setEditItem(item); setItemDialogOpen(true); }}>
                          <PencilIcon />
                        </Button>
                        <Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                          <TrashIcon />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="font-medium">
                    Total ({config.originCurrency})
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {shopping.items.reduce((s, i) => s + i.estimatedCost * i.quantity, 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {shopping.items.reduce((s, i) => s + (i.actualCost || 0) * i.quantity, 0).toLocaleString()}
                  </TableCell>
                  <TableCell colSpan={4} />
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    Converted ({config.destinationCurrency})
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    ≈ {(shopping.items.reduce((s, i) => s + i.estimatedCost * i.quantity, 0) * config.conversionRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    ≈ {(shopping.items.reduce((s, i) => s + (i.actualCost || 0) * i.quantity, 0) * config.conversionRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell colSpan={4} />
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}

      {config && (
        <ShoppingItemDialog open={itemDialogOpen} onOpenChange={setItemDialogOpen} item={editItem} defaultCurrency={config.originCurrency} />
      )}
      {shopping && (
        <BudgetDialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen} budget={shopping.budget} />
      )}
    </div>
  );
}
