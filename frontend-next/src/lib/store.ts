"use client";

import { useState, useEffect, useCallback } from "react";
import { AppState, Strategy } from "./types";
import { DEFAULT_STATE } from "./constants";
import { soundFX } from "./sound";

const STORAGE_KEY = "aquaghost_state_v2";

export function useAquaGhostStore() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [logs, setLogs] = useState<Array<{ id: string; time: string; text: string; type: "info" | "success" | "alert" | "warn" }>>([
    {
      id: "l-1",
      time: "12:04:19",
      text: "[CRE TEE] AWS Nitro Enclave listening on DON private channel. PCR0 validated.",
      type: "success"
    },
    {
      id: "l-2",
      time: "12:04:22",
      text: "[1inch Aqua] 3 non-custodial strategies active. Capital sits 100% in Maker wallet.",
      type: "info"
    },
    {
      id: "l-3",
      time: "12:04:25",
      text: "[Uniswap v4 Hook] beforeAddLiquidity guard engaged. Dynamic fee baseline: 30 BPS.",
      type: "info"
    }
  ]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setState(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const addLog = useCallback((text: string, type: "info" | "success" | "alert" | "warn" = "info") => {
    const time = new Date().toTimeString().split(" ")[0];
    const newLog = { id: `log-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, time, text, type };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  }, []);

  const updateState = useCallback(
    (updater: (prev: AppState) => AppState) => {
      setState((prev) => {
        const next = updater(prev);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  const resetState = useCallback(() => {
    setState(DEFAULT_STATE);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
    } catch {
      // ignore
    }
    soundFX.playClick();
    addLog("[System] State reset to initial genesis defaults.", "info");
  }, [addLog]);

  // Actions
  const dockStrategy = useCallback(
    (stratId: string) => {
      soundFX.playBeep(450, 0.1);
      updateState((prev) => {
        const strat = prev.strategies.find((s) => s.id === stratId);
        return {
          ...prev,
          strategies: prev.strategies.filter((s) => s.id !== stratId)
        };
      });
      addLog(`[1inch Aqua] Docked strategy ${stratId}. Capital returned to uncommitted virtual pool.`, "warn");
    },
    [updateState, addLog]
  );

  const shipStrategy = useCallback(
    (strat: Omit<Strategy, "id" | "status">) => {
      soundFX.playSuccess();
      const newId = `strat-${Date.now().toString().slice(-4)}`;
      updateState((prev) => ({
        ...prev,
        strategies: [
          ...prev.strategies,
          {
            ...strat,
            id: newId,
            status: "ACTIVE_NORMAL"
          }
        ]
      }));
      addLog(`[1inch Aqua] Shipped new strategy "${strat.name}" to Aqua Router. Virtualized non-custodial capital deployed.`, "success");
    },
    [updateState, addLog]
  );

  const simulateSwapperFill = useCallback(() => {
    soundFX.playBeep(700, 0.12);
    updateState((prev) => ({
      ...prev,
      walletBalances: {
        ...prev.walletBalances,
        USDC: prev.walletBalances.USDC + 2500,
        WETH: Math.max(0, prev.walletBalances.WETH - 0.833)
      }
    }));
    addLog("[1inch Aqua Swap] Swapper filled: +2,500 USDC received directly into Maker wallet, -0.833 WETH delivered atomically.", "success");
  }, [updateState, addLog]);

  const toggleDefenseOverride = useCallback(() => {
    soundFX.playClick();
    updateState((prev) => {
      const nextActive = !prev.hookState.defenseActive;
      const nextFee = nextActive ? 250 : 30;
      return {
        ...prev,
        hookState: {
          ...prev.hookState,
          defenseActive: nextActive,
          dynamicFeeBps: nextFee
        }
      };
    });
  }, [updateState]);

  return {
    state,
    logs,
    addLog,
    updateState,
    resetState,
    dockStrategy,
    shipStrategy,
    simulateSwapperFill,
    toggleDefenseOverride
  };
}
