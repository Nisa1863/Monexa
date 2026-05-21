import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateCashback, getCashbackSummary, getCashbackTransactions } from "../../services/api";

export function useCashbackData({ loadAllTransactions = false } = {}) {
  const [stores, setStores] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [disclaimer, setDisclaimer] = useState("");
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const requests = [getCashbackSummary()];
      if (loadAllTransactions) requests.push(getCashbackTransactions());
      const [sumRes, txRes] = await Promise.all(requests);
      const data = sumRes.data;
      setStores(data.stores || []);
      setSummary(data.summary || null);
      setDisclaimer(data.disclaimer || "");
      if (loadAllTransactions && txRes) {
        setTransactions(txRes.data.transactions || []);
      }
    } catch (err) {
      setMsg(err?.response?.data?.message || "Cashback verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [loadAllTransactions]);

  useEffect(() => {
    load();
  }, [load]);

  const onCalculate = async () => {
    try {
      setCalculating(true);
      setMsg("");
      const { data } = await calculateCashback();
      setStores(data.stores || []);
      setSummary(data.summary || null);
      setDisclaimer(data.disclaimer || "");
      if (loadAllTransactions) {
        const txRes = await getCashbackTransactions();
        setTransactions(txRes.data.transactions || []);
      }
      setMsg("Cashback hesaplaması güncellendi.");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Hesaplama başarısız.");
    } finally {
      setCalculating(false);
    }
  };

  const partnerStores = useMemo(
    () =>
      [...stores]
        .filter((s) => s.isActive !== false && s.status === "active")
        .sort((a, b) => Number(b.cashbackRate) - Number(a.cashbackRate)),
    [stores]
  );

  const charts = summary?.charts || {};

  const monthlyChart = useMemo(
    () => ({
      labels: charts.monthly?.labels || [],
      data: charts.monthly?.data || []
    }),
    [charts.monthly]
  );

  const categoryChart = useMemo(
    () => ({
      labels: charts.byCategory?.labels || [],
      data: charts.byCategory?.data || []
    }),
    [charts.byCategory]
  );

  const storeChart = useMemo(
    () => ({
      labels: charts.byStore?.labels || [],
      data: charts.byStore?.data || []
    }),
    [charts.byStore]
  );

  return {
    stores,
    summary,
    disclaimer,
    loading,
    calculating,
    msg,
    setMsg,
    load,
    onCalculate,
    partnerStores,
    transactions,
    recentTx: loadAllTransactions
      ? transactions
      : summary?.recentTransactions || [],
    monthlyChart,
    categoryChart,
    storeChart
  };
}
