import React, { useState } from 'react';
import { Play, Download, Cpu, GitBranch, Table, FileText, Loader2, CheckCircle2, Terminal } from 'lucide-react';
import { api } from '../api/tradelensApi';

export default function JavaLabPage() {
  const [activeTab, setActiveTab] = useState('threads'); // 'threads', 'streams', 'collections', 'files'
  const [threadResult, setThreadResult] = useState(null);
  const [streamResult, setStreamResult] = useState(null);
  const [collectionsResult, setCollectionsResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRunThreads = async () => {
    setIsLoading(true);
    try {
      const res = await api.runThreadSimulation();
      setThreadResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunStreams = async () => {
    setIsLoading(true);
    try {
      const res = await api.runStreamLab();
      setStreamResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadCollections = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCollectionsMatrix();
      setCollectionsResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F293D]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Interactive Java Syllabus Lab</h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
              Live Core Java Demo
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Execute real-time multithreading, Stream API pipelines, Collections analysis, and File I/O directly in the JVM.
          </p>
        </div>

        {/* CSV Export Action Button */}
        <a
          href="/api/export/csv"
          download="tradelens_orders.csv"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Orders to CSV (FileWriter)</span>
        </a>
      </div>

      {/* Lab Mode Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#1F293D]">
        {[
          { id: 'threads', label: '1. Multithreading (wait/notifyAll)', icon: Cpu },
          { id: 'streams', label: '2. Stream API Pipelines', icon: GitBranch },
          { id: 'collections', label: '3. Collections Framework Matrix', icon: Table },
          { id: 'files', label: '4. File Handling & CSV I/O', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'collections' && !collectionsResult) handleLoadCollections();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-[#161F30] border border-[#1F293D] text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Multithreading Lab */}
      {activeTab === 'threads' && (
        <div className="space-y-6">
          <div className="bg-[#161F30] border border-[#1F293D] rounded-2xl p-6 glow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Producer-Consumer Order Queue Simulation</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Demonstrates inter-thread communication using synchronized monitor locks, bounded buffer capacity (size 3),
                  <code className="text-amber-400 font-mono"> wait()</code> when full/empty, and <code className="text-emerald-400 font-mono">notifyAll()</code> upon state changes.
                </p>
              </div>
              <button
                onClick={handleRunThreads}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 transition-all shrink-0 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                <span>Execute Thread Simulation</span>
              </button>
            </div>

            {/* Architecture Explanation Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
              <div className="p-3 rounded-xl bg-[#111827] border border-[#1F293D] space-y-1">
                <span className="text-blue-400 font-bold block text-[10px] uppercase font-mono">Thread 1: Producer</span>
                <p className="text-slate-300 text-[11px]">Investor trade generator produces buy/sell orders and enqueues to buffer.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#111827] border border-[#1F293D] space-y-1">
                <span className="text-amber-400 font-bold block text-[10px] uppercase font-mono">Bounded Buffer (3)</span>
                <p className="text-slate-300 text-[11px]">When full, producer calls <code className="text-amber-400 font-mono">wait()</code>. When empty, consumer calls <code className="text-amber-400 font-mono">wait()</code>.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#111827] border border-[#1F293D] space-y-1">
                <span className="text-emerald-400 font-bold block text-[10px] uppercase font-mono">Thread 2: Consumer</span>
                <p className="text-slate-300 text-[11px]">Exchange engine dequeues orders, settles trade, and triggers <code className="text-emerald-400 font-mono">notifyAll()</code>.</p>
              </div>
            </div>

            {/* Simulation Trace Output */}
            {threadResult && (
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Total Orders Settled: <strong className="text-white">{threadResult.totalOrdersProcessed}</strong></span>
                  <span className="text-slate-400">Execution Duration: <strong className="text-emerald-400">{threadResult.executionDurationMs} ms</strong></span>
                </div>

                <div className="bg-[#0B0F19] border border-[#1F293D] rounded-xl p-4 font-mono text-xs text-slate-300 max-h-72 overflow-y-auto space-y-2">
                  <div className="text-slate-500 pb-2 border-b border-[#1F293D] flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>JVM Thread Event Log (Chronological Trace):</span>
                  </div>
                  {threadResult.traceLogs?.map((log, idx) => (
                    <div key={idx} className={`leading-relaxed ${
                      log.includes('wait()') ? 'text-amber-400' :
                      log.includes('CONSUMED') ? 'text-emerald-400' :
                      log.includes('PRODUCED') ? 'text-blue-400' : 'text-slate-300'
                    }`}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Stream API Lab */}
      {activeTab === 'streams' && (
        <div className="space-y-6">
          <div className="bg-[#161F30] border border-[#1F293D] rounded-2xl p-6 glow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Java Stream API Pipeline Benchmarks</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Demonstrates intermediate operations (<code className="text-blue-400 font-mono">filter</code>, <code className="text-blue-400 font-mono">map</code>, <code className="text-blue-400 font-mono">sorted</code>, <code className="text-blue-400 font-mono">distinct</code>, <code className="text-blue-400 font-mono">limit</code>, <code className="text-blue-400 font-mono">skip</code>) and terminal operations (<code className="text-emerald-400 font-mono">collect</code>, <code className="text-emerald-400 font-mono">reduce</code>, <code className="text-emerald-400 font-mono">summaryStatistics</code>).
                </p>
              </div>
              <button
                onClick={handleRunStreams}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 transition-all shrink-0 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                <span>Execute Stream Pipelines</span>
              </button>
            </div>

            {streamResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs font-mono">
                {/* Metric 1 */}
                <div className="p-4 rounded-xl bg-[#111827] border border-[#1F293D] space-y-2">
                  <div className="flex justify-between items-center text-slate-400 font-sans">
                    <span className="font-bold text-white">Stream filter() & map()</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">Gainers</span>
                  </div>
                  <p className="text-[11px] text-slate-300">Found {streamResult.gainersCount} positive gainers today:</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {streamResult.gainersList?.slice(0, 6).map((g, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="p-4 rounded-xl bg-[#111827] border border-[#1F293D] space-y-2">
                  <div className="flex justify-between items-center text-slate-400 font-sans">
                    <span className="font-bold text-white">Stream distinct() & sorted()</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">Sectors</span>
                  </div>
                  <p className="text-[11px] text-slate-300">Extracted {streamResult.distinctSectorsCount} unique market sectors:</p>
                  <div className="flex flex-wrap gap-1.5 pt-1 font-sans">
                    {streamResult.distinctSectors?.map((sec, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="p-4 rounded-xl bg-[#111827] border border-[#1F293D] space-y-2">
                  <div className="flex justify-between items-center text-slate-400 font-sans">
                    <span className="font-bold text-white">Stream reduce() & Statistics</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">Aggregations</span>
                  </div>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <div>Total Share Capitalization: <strong className="text-white">₹{streamResult.totalCombinedSharePrice?.toLocaleString()}</strong></div>
                    <div>Highest Single Stock Price: <strong className="text-emerald-400">₹{streamResult.streamSummaryStatistics?.maxPrice?.toLocaleString()}</strong></div>
                    <div>Lowest Single Stock Price: <strong className="text-rose-400">₹{streamResult.streamSummaryStatistics?.minPrice?.toLocaleString()}</strong></div>
                    <div>Average Stock Price: <strong className="text-blue-400">₹{streamResult.streamSummaryStatistics?.averagePrice?.toLocaleString()}</strong></div>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="p-4 rounded-xl bg-[#111827] border border-[#1F293D] space-y-2">
                  <div className="flex justify-between items-center text-slate-400 font-sans">
                    <span className="font-bold text-white">Collectors.groupingBy()</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">Distribution</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    {Object.entries(streamResult.sectorDistribution || {}).map(([sec, count]) => (
                      <div key={sec} className="flex justify-between border-b border-[#1F293D] pb-1">
                        <span className="truncate max-w-[130px] font-sans">{sec}:</span>
                        <strong className="text-purple-400">{count} stocks</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Collections Matrix */}
      {activeTab === 'collections' && (
        <div className="bg-[#161F30] border border-[#1F293D] rounded-2xl p-6 glow-card space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Core Java Collections Framework Architecture</h3>
            <p className="text-xs text-slate-400 mt-1">
              Theoretical data structures, asymptotic time complexities, and exact placement inside TradeLens.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1F293D] text-slate-400 font-semibold uppercase">
                  <th className="pb-3">Collection Class</th>
                  <th className="pb-3">Interface</th>
                  <th className="pb-3">Underlying Data Structure</th>
                  <th className="pb-3">Time Complexity</th>
                  <th className="pb-3">Ordering & Duplicates</th>
                  <th className="pb-3">Usage in TradeLens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D]/50 font-mono text-[11px]">
                {collectionsResult?.map((c, i) => (
                  <tr key={i} className="hover:bg-[#111827]/40 transition-colors">
                    <td className="py-3 font-bold text-emerald-400">{c.collection}</td>
                    <td className="py-3 text-slate-300 font-sans">{c.interface}</td>
                    <td className="py-3 text-slate-400 font-sans">{c.internalStructure}</td>
                    <td className="py-3 text-blue-400">{c.timeComplexity}</td>
                    <td className="py-3 text-slate-300 font-sans">
                      <div>{c.ordering}</div>
                      <div className="text-[10px] text-slate-500">Duplicates: {c.duplicatesAllowed ? 'Allowed' : 'Rejected'}</div>
                    </td>
                    <td className="py-3 text-amber-300 font-sans text-xs">{c.tradeLensUsage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: File Handling & CSV */}
      {activeTab === 'files' && (
        <div className="bg-[#161F30] border border-[#1F293D] rounded-2xl p-6 glow-card space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Core Java File I/O & CSV Generation</h3>
            <p className="text-xs text-slate-400 mt-1">
              Demonstrates Character Stream reading and writing using <code className="text-emerald-400 font-mono">FileWriter</code>, <code className="text-emerald-400 font-mono">BufferedWriter</code>, <code className="text-blue-400 font-mono">FileReader</code>, and <code className="text-blue-400 font-mono">BufferedReader</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#111827] border border-[#1F293D] space-y-3 text-xs leading-relaxed">
            <div className="flex items-center gap-2 text-white font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>CSV Transaction Export Mechanism</span>
            </div>
            <p className="text-slate-300">
              When you click the button below, the backend invokes <code className="text-emerald-400 font-mono">CSVFileHandler.exportOrdersToCSV()</code>.
              It streams all settled database orders, formats them with comma delimiters, writes the file to disk using <code className="text-emerald-400 font-mono">BufferedWriter(new FileWriter("orders_export.csv"))</code>, and streams the binary bytes with <code className="text-blue-400 font-mono">Content-Disposition: attachment; filename="tradelens_orders.csv"</code> directly to your browser downloads.
            </p>
            <div className="pt-2">
              <a
                href="/api/export/csv"
                download="tradelens_orders.csv"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download tradelens_orders.csv Now</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

