"use client";

import { useState, useEffect, useCallback } from "react";
import { AppState, Strategy } from "./types";
import { DEFAULT_STATE } from "./constants";
import { soundFX } from "./sound";

const STORAGE_KEY = "aquaghost_state_v3";

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

  const simulateSwapperFill = useCallback(async () => {
    soundFX.playBeep(700, 0.12);
    addLog("[1inch Aqua] Dispatching on-chain swap settlement to Base Sepolia (Chain 84532)...", "info");

    try {
      const res = await fetch("/api/tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "swap_fill" })
      });
      const data = await res.json();

      if (data.success) {
        soundFX.playSuccess();
        const newTx = {
          txHash: data.txHash,
          blockNumber: data.blockNumber,
          explorerUrl: data.explorerUrl,
          action: "SWAP_FILL",
          summary: "1inch Aqua swap fill executed: +2,500 USDC / -0.833 WETH settled directly in Maker wallet.",
          timestamp: new Date().toTimeString().split(" ")[0] + " UTC"
        };

        updateState((prev) => ({
          ...prev,
          walletBalances: {
            ...prev.walletBalances,
            USDC: prev.walletBalances.USDC + 2500,
            WETH: Math.max(0, prev.walletBalances.WETH - 0.833)
          },
          lastTx: newTx
        }));

        addLog(`[Base Sepolia On-Chain] Swap confirmed in Block #${data.blockNumber}! Tx: ${data.txHash.slice(0, 14)}...`, "success");
        addLog(`[BaseScan Explorer] ${data.explorerUrl}`, "info");
        return data;
      } else {
        addLog(`[Tx Error] ${data.error || "Failed to broadcast swap fill"}`, "alert");
      }
    } catch (err: any) {
      addLog(`[Network Error] ${err.message}`, "alert");
    }
  }, [updateState, addLog]);

  const toggleDefenseOverride = useCallback(async () => {
    soundFX.playClick();
    const nextActive = !state.hookState.defenseActive;
    const nextFee = nextActive ? 250 : 30;
    const action = nextActive ? "defense_threat" : "defense_disarm";

    addLog(`[Uniswap v4 Hook] Broadcasting setDefenseMode(active=${nextActive}, fee=${nextFee} BPS) to Base Sepolia...`, "info");

    try {
      const res = await fetch("/api/tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, feeBps: nextFee })
      });
      const data = await res.json();

      if (data.success) {
        soundFX.playAttestation();
        const newTx = {
          txHash: data.txHash,
          blockNumber: data.blockNumber,
          explorerUrl: data.explorerUrl,
          action: nextActive ? "DEFENSE_ACTIVE" : "DEFENSE_DISARMED",
          summary: nextActive
            ? `Uniswap v4 Hook ARMED on Base Sepolia with ${nextFee} BPS dynamic fee.`
            : `Uniswap v4 Hook DISARMED on Base Sepolia (30 BPS baseline).`,
          timestamp: new Date().toTimeString().split(" ")[0] + " UTC"
        };

        updateState((prev) => ({
          ...prev,
          hookState: {
            ...prev.hookState,
            defenseActive: nextActive,
            dynamicFeeBps: nextFee
          },
          lastTx: newTx
        }));

        addLog(`[Base Sepolia On-Chain] Hook state updated in Block #${data.blockNumber}! Tx: ${data.txHash.slice(0, 14)}...`, "success");
        addLog(`[BaseScan Explorer] ${data.explorerUrl}`, "info");
        return data;
      } else {
        addLog(`[Tx Error] ${data.error || "Failed to broadcast defense toggle"}`, "alert");
      }
    } catch (err: any) {
      addLog(`[Network Error] ${err.message}`, "alert");
    }
  }, [state.hookState.defenseActive, updateState, addLog]);

  const executeOnChainDefense = useCallback(async (feeBps: number = 250) => {
    soundFX.playAlert();
    addLog(`[Sentinel TEE] Dispatching hardware-attested setDefenseMode(fee=${feeBps} BPS) to Base Sepolia...`, "alert");

    try {
      const res = await fetch("/api/tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "defense_threat", feeBps })
      });
      const data = await res.json();

      if (data.success) {
        soundFX.playAttestation();
        const newTx = {
          txHash: data.txHash,
          blockNumber: data.blockNumber,
          explorerUrl: data.explorerUrl,
          action: "DEFENSE_ACTIVE",
          summary: `Uniswap v4 Hook defense mode ARMED on Base Sepolia with ${feeBps} BPS fee.`,
          timestamp: new Date().toTimeString().split(" ")[0] + " UTC"
        };

        updateState((prev) => ({
          ...prev,
          sentinel: {
            ...prev.sentinel,
            status: "DEFENSE_ACTIVE",
            isUnderAttack: true
          },
          hookState: {
            ...prev.hookState,
            defenseActive: true,
            dynamicFeeBps: feeBps,
            totalAttacksBlocked: prev.hookState.totalAttacksBlocked + 1
          },
          lastTx: newTx
        }));

        addLog(`[Base Sepolia On-Chain] Attested Defense Mode engaged in Block #${data.blockNumber}! Tx: ${data.txHash.slice(0, 14)}...`, "success");
        addLog(`[BaseScan Explorer] ${data.explorerUrl}`, "info");
        return data;
      } else {
        addLog(`[Tx Error] ${data.error || "Failed to broadcast defense on-chain"}`, "alert");
      }
    } catch (err: any) {
      addLog(`[Network Error] ${err.message}`, "alert");
    }
  }, [updateState, addLog]);

  return {
    state,
    logs,
    addLog,
    updateState,
    resetState,
    dockStrategy,
    shipStrategy,
    simulateSwapperFill,
    toggleDefenseOverride,
    executeOnChainDefense
  };
}
