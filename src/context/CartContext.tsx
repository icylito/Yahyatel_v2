/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";

export interface CartItem {
    cartId: string;
    id: string;
    name: string;
    price: number;
    type: string;
    speed: string;
    quantity: number;
    icon?: React.ReactNode;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: Omit<CartItem, "cartId" | "quantity">) => void;
    removeFromCart: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const addToCart = (item: Omit<CartItem, "cartId" | "quantity">) => {
        const cartId = Math.random().toString(36).substr(2, 9);
        setCartItems((prev) => [...prev, { ...item, cartId, quantity: 1 }]);
    };

    const removeFromCart = (cartId: string) => {
        setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
    };

    const updateQuantity = (cartId: string, quantity: number) => {
        if (quantity < 1) return;
        setCartItems((prev) =>
            prev.map((item) => item.cartId === cartId ? { ...item, quantity } : item)
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, totalAmount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
