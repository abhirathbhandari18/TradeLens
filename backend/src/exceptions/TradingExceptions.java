package exceptions;

/**
 * Custom checked exceptions for TradeLens trading and authentication rules.
 */
public class TradingExceptions {

    /** Thrown when a user tries to BUY shares without enough available cash balance. */
    public static class InsufficientFundsException extends Exception {
        public InsufficientFundsException(String message) {
            super(message);
        }
    }

    /** Thrown when a user tries to SELL more shares than they currently own. */
    public static class InsufficientHoldingsException extends Exception {
        public InsufficientHoldingsException(String message) {
            super(message);
        }
    }

    /** Thrown when a request is missing a valid login token. */
    public static class UnauthorizedException extends Exception {
        public UnauthorizedException(String message) {
            super(message);
        }
    }
}
