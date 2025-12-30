'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Gift, CheckCircle2, Clock } from 'lucide-react';
import { 
  getAllVouchers, 
  addVoucher, 
  updateVoucher, 
  deleteVoucher,
  fulfillVoucherRedemption,
  getUserRedemptions
} from '@/firebase/firestore/vouchers';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { Voucher, VoucherRedemption } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminRewardsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [vouchers, setVouchers] = useState<(Voucher & { id: string })[]>([]);
  const [redemptions, setRedemptions] = useState<(VoucherRedemption & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<(Voucher & { id: string }) | null>(null);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    voucherType: 'amazon' as 'amazon' | 'petrol' | 'grocery' | 'other',
    pointsRequired: 500,
    value: 500,
    imageUrl: '',
    terms: '',
    active: true,
    stock: undefined as number | undefined,
  });

  useEffect(() => {
    if (!firestore) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [vouchersData, redemptionsSnapshot] = await Promise.all([
          getAllVouchers(firestore),
          getDocs(query(collection(firestore, 'voucher-redemptions'), orderBy('redeemedAt', 'desc'))),
        ]);
        setVouchers(vouchersData);
        setRedemptions(redemptionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as (VoucherRedemption & { id: string })[]);
      } catch (error: any) {
        console.error('Error loading admin rewards data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load rewards data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [firestore]);

  const handleOpenDialog = (voucher?: Voucher & { id: string }) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setFormData({
        name: voucher.name,
        description: voucher.description || '',
        voucherType: voucher.voucherType,
        pointsRequired: voucher.pointsRequired,
        value: voucher.value,
        imageUrl: voucher.imageUrl || '',
        terms: voucher.terms || '',
        active: voucher.active,
        stock: voucher.stock,
      });
    } else {
      setEditingVoucher(null);
      setFormData({
        name: '',
        description: '',
        voucherType: 'amazon',
        pointsRequired: 500,
        value: 500,
        imageUrl: '',
        terms: '',
        active: true,
        stock: undefined,
      });
    }
    setDialogOpen(true);
  };

  const handleSaveVoucher = async () => {
    if (!firestore) return;

    if (!formData.name || formData.pointsRequired <= 0 || formData.value <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingVoucher) {
        await updateVoucher(firestore, editingVoucher.id, formData);
        toast({
          title: 'Success',
          description: 'Voucher updated successfully',
        });
      } else {
        await addVoucher(firestore, formData);
        toast({
          title: 'Success',
          description: 'Voucher created successfully',
        });
      }

      // Reload vouchers
      const vouchersData = await getAllVouchers(firestore);
      setVouchers(vouchersData);
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save voucher',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteVoucher = async (voucherId: string) => {
    if (!firestore) return;
    if (!confirm('Are you sure you want to delete this voucher?')) return;

    try {
      await deleteVoucher(firestore, voucherId);
      toast({
        title: 'Success',
        description: 'Voucher deleted successfully',
      });

      // Reload vouchers
      const vouchersData = await getAllVouchers(firestore);
      setVouchers(vouchersData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete voucher',
        variant: 'destructive',
      });
    }
  };

  const handleFulfillRedemption = async (redemptionId: string, voucherCode: string) => {
    if (!firestore) return;

    setFulfillingId(redemptionId);
    try {
      await fulfillVoucherRedemption(firestore, redemptionId, voucherCode);
      toast({
        title: 'Success',
        description: 'Redemption fulfilled successfully',
      });

      // Reload redemptions
      const redemptionsSnapshot = await getDocs(
        query(collection(firestore, 'voucher-redemptions'), orderBy('redeemedAt', 'desc'))
      );
      setRedemptions(redemptionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as (VoucherRedemption & { id: string })[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fulfill redemption',
        variant: 'destructive',
      });
    } finally {
      setFulfillingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Fulfilled</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Rewards Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage vouchers and fulfill redemption requests
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Voucher
        </Button>
      </div>

      {/* Vouchers List */}
      <Card>
        <CardHeader>
          <CardTitle>Vouchers</CardTitle>
          <CardDescription>Manage available vouchers for redemption</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No vouchers found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-semibold">{voucher.name}</TableCell>
                    <TableCell>{voucher.voucherType}</TableCell>
                    <TableCell>{voucher.pointsRequired.toLocaleString()}</TableCell>
                    <TableCell>₹{voucher.value}</TableCell>
                    <TableCell>
                      {voucher.stock !== undefined 
                        ? `${voucher.stock - (voucher.redeemedCount || 0)} / ${voucher.stock}`
                        : 'Unlimited'}
                    </TableCell>
                    <TableCell>
                      {voucher.active ? (
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(voucher)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVoucher(voucher.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Redemptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Redemption Requests</CardTitle>
          <CardDescription>Fulfill voucher redemption requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : redemptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No redemption requests
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions.map((redemption) => (
                  <TableRow key={redemption.id}>
                    <TableCell>{redemption.userId}</TableCell>
                    <TableCell className="font-semibold">{redemption.voucherName}</TableCell>
                    <TableCell>{redemption.pointsSpent.toLocaleString()}</TableCell>
                    <TableCell>₹{redemption.voucherValue}</TableCell>
                    <TableCell>{getStatusBadge(redemption.status)}</TableCell>
                    <TableCell>
                      {(() => {
                        const redeemedAt = redemption.redeemedAt as any;
                        const date = redeemedAt instanceof Date 
                          ? redeemedAt 
                          : redeemedAt?.seconds 
                            ? new Date(redeemedAt.seconds * 1000)
                            : redeemedAt?.toDate
                              ? redeemedAt.toDate()
                              : new Date();
                        return date.toLocaleDateString();
                      })()}
                    </TableCell>
                    <TableCell>
                      {redemption.status === 'pending' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Fulfill
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Fulfill Redemption</DialogTitle>
                              <DialogDescription>
                                Enter the voucher code for {redemption.voucherName}
                              </DialogDescription>
                            </DialogHeader>
                            <FulfillForm
                              redemptionId={redemption.id}
                              onFulfill={handleFulfillRedemption}
                              loading={fulfillingId === redemption.id}
                            />
                          </DialogContent>
                        </Dialog>
                      )}
                      {redemption.voucherCode && (
                        <div className="text-sm font-mono text-primary">
                          {redemption.voucherCode}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Voucher Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVoucher ? 'Edit Voucher' : 'Add New Voucher'}
            </DialogTitle>
            <DialogDescription>
              {editingVoucher ? 'Update voucher details' : 'Create a new voucher for users to redeem'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Voucher Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Amazon Voucher ₹500"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the voucher"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="voucherType">Voucher Type *</Label>
                <Select
                  value={formData.voucherType}
                  onValueChange={(value: any) => setFormData({ ...formData, voucherType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amazon">Amazon</SelectItem>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="grocery">Grocery</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">Voucher Value (₹) *</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
                  min="1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pointsRequired">Points Required *</Label>
                <Input
                  id="pointsRequired"
                  type="number"
                  value={formData.pointsRequired}
                  onChange={(e) => setFormData({ ...formData, pointsRequired: parseInt(e.target.value) || 0 })}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock (leave empty for unlimited)</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    stock: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  min="1"
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Terms and conditions for this voucher"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label>Active (available for redemption)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVoucher}>
              {editingVoucher ? 'Update' : 'Create'} Voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FulfillForm({ 
  redemptionId, 
  onFulfill, 
  loading 
}: { 
  redemptionId: string; 
  onFulfill: (id: string, code: string) => void;
  loading: boolean;
}) {
  const [voucherCode, setVoucherCode] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="voucherCode">Voucher Code *</Label>
        <Input
          id="voucherCode"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value)}
          placeholder="Enter voucher code"
        />
      </div>
      <Button
        onClick={() => {
          if (voucherCode.trim()) {
            onFulfill(redemptionId, voucherCode.trim());
            setVoucherCode('');
          }
        }}
        disabled={!voucherCode.trim() || loading}
        className="w-full"
      >
        {loading ? 'Processing...' : 'Fulfill Redemption'}
      </Button>
    </div>
  );
}

