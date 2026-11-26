package com.tradelens.exceptions;

/**
 * Custom checked exceptions for TradeLens trading and authentication rules.
 */
public class TradingExceptions {

    public static class InsufficientFundsException extends Exception {
        public InsufficientFundsException(String message) {
            super(message);
        }
    }

    public static class InsufficientHoldingsException extends Exception {
        public InsufficientHoldingsException(String message) {
            super(message);
        }
    }

    public static class UnauthorizedException extends Exception {
        public UnauthorizedException(String message) {
            super(message);
        }
    }
}
