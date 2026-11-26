package com.tradelens.dao;

import com.tradelens.model.Identifiable;

import java.sql.SQLException;
import java.util.List;

/**
 * TradeLens - Generic Data Access Object Interface
 *
 * Demonstrates:
 * 1. Generics: Type parameters <T, ID>.
 * 2. Bounded Type Parameter: <T extends Identifiable<ID>>.
 * 3. Type-safe abstraction for CRUD operations across diverse entities.
 */
public interface GenericDAO<T extends Identifiable<ID>, ID> {

    List<T> findAll() throws SQLException;

    T findById(ID id) throws SQLException;

    boolean save(T entity) throws SQLException;

    boolean deleteById(ID id) throws SQLException;
}
