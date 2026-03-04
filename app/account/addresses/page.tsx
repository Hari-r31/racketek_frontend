"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Plus, Trash2, Edit3, Star } from "lucide-react";
import api from "@/lib/api";
import { Address } from "@/types";
import toast from "react-hot-toast";

const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(10),
  address_line1: z.string().min(5),
  address_line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(6).max(6),
  country: z.string().default("India"),
  address_type: z.enum(["home", "work", "other"]).default("home"),
  is_default: z.boolean().default(false),
});
type FormData = z.infer<typeof schema>;

function AddressForm({
  initial,
  onClose,
}: {
  initial?: Address;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial || { country: "India", address_type: "home" },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      initial
        ? api.put(`/addresses/${initial.id}`, data)
        : api.post("/addresses", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      qc.invalidateQueries({ queryKey: ["checkout-addresses"] }); // bust checkout address cache
      toast.success(initial ? "Address updated" : "Address added!");
      onClose();
    },
    onError: () => toast.error("Failed to save address"),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name</label>
          <input {...register("full_name")} className="input" />
          {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input {...register("phone")} className="input" />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Address Line 1</label>
        <input {...register("address_line1")} className="input" placeholder="House no, street name" />
        {errors.address_line1 && <p className="text-xs text-red-500 mt-1">{errors.address_line1.message}</p>}
      </div>

      <div>
        <label className="label">Address Line 2 (optional)</label>
        <input {...register("address_line2")} className="input" placeholder="Landmark, area" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">City</label>
          <input {...register("city")} className="input" />
        </div>
        <div>
          <label className="label">State</label>
          <input {...register("state")} className="input" />
        </div>
        <div>
          <label className="label">Pincode</label>
          <input {...register("pincode")} className="input" maxLength={6} />
          {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Type</label>
          <select {...register("address_type")} className="input">
            <option value="home">Home</option>
            <option value="work">Work</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex items-end pb-2.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("is_default")} className="w-4 h-4 text-brand-600 rounded" />
            <span className="text-sm text-gray-700">Set as default</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
          {mutation.isPending ? "Saving..." : initial ? "Update Address" : "Add Address"}
        </button>
        <button type="button" onClick={onClose} className="btn-outline flex-1">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AddressesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const { data: addresses, isLoading } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: () => api.get("/addresses").then((r) => r.data),
  });

  const deleteAddress = useMutation({
    mutationFn: (id: number) => api.delete(`/addresses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      qc.invalidateQueries({ queryKey: ["checkout-addresses"] });
      toast.success("Address deleted");
    },
  });

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-gray-900 text-xl">Saved Addresses</h2>
          <button
            onClick={() => { setEditingAddress(null); setShowForm(true); }}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus size={15} /> Add New
          </button>
        </div>

        {/* Add / Edit Form */}
        {(showForm || editingAddress) && (
          <div className="border border-brand-200 rounded-xl p-5 mb-6 bg-brand-50/30">
            <h3 className="font-bold text-gray-800 mb-4">
              {editingAddress ? "Edit Address" : "New Address"}
            </h3>
            <AddressForm
              initial={editingAddress || undefined}
              onClose={() => { setShowForm(false); setEditingAddress(null); }}
            />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl" />
            ))}
          </div>
        ) : !addresses?.length ? (
          <div className="text-center py-8">
            <MapPin size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No addresses saved yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`border rounded-xl p-4 ${addr.is_default ? "border-brand-300 " : "border-gray-200"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-800">{addr.full_name}</p>
                      <span className="badge bg-gray-100 text-gray-600 capitalize">{addr.address_type}</span>
                      {addr.is_default && (
                        <span className="badge bg-brand-100 text-brand-700 flex items-center gap-1">
                          <Star size={10} fill="currentColor" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}</p>
                    <p className="text-sm text-gray-600">{addr.city}, {addr.state} – {addr.pincode}</p>
                    <p className="text-sm text-gray-500 mt-1">📞 {addr.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingAddress(addr); setShowForm(false); }}
                      className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit3 size={13} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => deleteAddress.mutate(addr.id)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                    >
                      <Trash2 size={13} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
