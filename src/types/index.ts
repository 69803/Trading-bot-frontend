export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface PortfolioSummary {
  balance: number;
  equity: number;
  pnl: number;
  daily_pnl: number;
  open_positions_count: number;
  closed_positions_count: number;
  win_rate: number;
  bot_running: boolean;
}

export interface PortfolioHistoryItem {
  timestamp: string;
  total_value: number;
  cash: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: "long" | "short";
  investment_amount: number | null;
  quantity: number;
  avg_entry_price: number;
  current_price: number | null;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  is_open: boolean;
  opened_at: string;
  closed_at: string | null;
  closed_price: number | null;
  realized_pnl: number;
  unrealized_pnl: number;
  pnl_percentage: number;
  /** null = manual trade, string = bot id that opened this position */
  bot_id: string | null;
}

// Matches backend PortfolioOut schema
export interface Portfolio {
  id: string;
  user_id: string;
  initial_capital: number;
  cash_balance: number;
  realized_pnl: number;
  unrealized_pnl: number;
  total_value: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  order_type: "market" | "limit";
  investment_amount: number | null;
  quantity: number;
  filled_quantity: number;
  limit_price: number | null;
  avg_fill_price: number | null;
  status: "pending" | "filled" | "cancelled" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  realized_pnl: number | null;
}

export interface BalanceResponse {
  cash_balance: number;
  equity: number;
  unrealized_pnl: number;
  realized_pnl: number;
}

export interface OrdersResponse {
  items: Order[];
  total: number;
}

export interface Trade {
  id: string;
  order_id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  commission: number;
  realized_pnl: number | null;
  executed_at: string;
  /** null = manual trade, string = bot id that executed this trade */
  bot_id: string | null;
}

export interface TradesResponse {
  items: Trade[];
  total: number;
}

export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandlesResponse {
  symbol: string;
  timeframe: string;
  candles: Candle[];
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  change_pct: number;
  bid: number;
  ask: number;
  timestamp: string;
}

export interface QuotesResponse {
  quotes: Quote[];
}

// Backend returns symbols as plain string array
export interface SymbolsResponse {
  symbols: string[];
}

export interface StrategyConfig {
  id: string;
  ema_fast: number;
  ema_slow: number;
  rsi_period: number;
  rsi_overbought: number;
  rsi_oversold: number;
  auto_trade: boolean;
  symbols: string[];
  updated_at: string;
}

export interface Signal {
  id: string;
  symbol: string;
  signal_type: "buy" | "sell" | "hold";
  ema_fast_value: number;
  ema_slow_value: number;
  rsi_value: number;
  price_at_signal: number;
  confidence: number;
  acted_on: boolean;
  triggered_at: string;
}

export interface SignalsResponse {
  signals: Signal[];
}

export interface RiskSettings {
  id: string;
  max_position_size_pct: number;
  max_daily_loss_pct: number;
  max_open_positions: number;
  stop_loss_pct: number;
  take_profit_pct: number;
  max_drawdown_pct: number;
  updated_at: string;
}

export interface RiskStatus {
  current_drawdown_pct: number;
  daily_pnl: number;
  daily_pnl_pct: number;
  open_position_count: number;
  trading_halted: boolean;
  halt_reason: string | null;
}

// stop_loss_pct and take_profit_pct are required by the backend schema
export interface BacktestParams {
  symbol: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  ema_fast: number;
  ema_slow: number;
  rsi_period: number;
  rsi_overbought: number;
  rsi_oversold: number;
  stop_loss_pct: number;
  take_profit_pct: number;
  commission_pct: number;
}

// Backend returns BacktestRunOut which has "id" (not "run_id")
export interface BacktestRunResponse {
  id: string;
  status: string;
  progress_pct: number;
}

// Matches BacktestRunOut schema
export interface BacktestStatusResponse {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  progress_pct: number;
}

export interface BacktestMetrics {
  total_trades: number;
  win_trades: number;
  loss_trades: number;
  win_rate: number;
  net_pnl: number;
  max_drawdown_pct: number;
  avg_win: number;
  avg_loss: number;
  sharpe_ratio: number;
  profit_factor: number;
}

// Backend trade_log fields: entry_time, exit_time, qty (not entry_date, exit_date, quantity)
export interface BacktestTrade {
  entry_time: string;
  exit_time: string;
  side: string;
  entry_price: number;
  exit_price: number;
  qty: number;
  pnl: number;
  exit_reason: string;
}

// Matches the /backtest/{run_id}/results response shape
export interface BacktestResults {
  id: string;
  status: string;
  progress_pct: number;
  results: BacktestMetrics | null;
  equity_curve: { timestamp: string; equity: number }[] | null;
  trade_log: BacktestTrade[] | null;
  error_message: string | null;
}

// Matches BacktestRunOut (stored results field is BacktestMetrics)
export interface BacktestRun {
  id: string;
  symbol: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  status: "queued" | "running" | "completed" | "failed";
  progress_pct: number;
  results: BacktestMetrics | null;
  equity_curve: { timestamp: string; equity: number }[] | null;
  trade_log: BacktestTrade[] | null;
  created_at: string;
}

export interface BacktestHistoryResponse {
  items: BacktestRun[];
  total: number;
}

export interface BotStatus {
  is_running: boolean;
  started_at: string | null;
  last_cycle_at: string | null;
  cycles_run: number;
  last_log: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface FullTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
