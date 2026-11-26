package com.tradelens.model;

/**
 * TradeLens - Identifiable Interface for Generics Demonstration
 *
 * Demonstrates:
 * 1. Generics: Generic interface with type parameter <ID>.
 * 2. Contract for entities possessing a unique identifier.
 */
public interface Identifiable<ID> {
    ID getId();
}
