package com.kyuubisoft.api.metrics;

import com.hypixel.hytale.server.core.universe.PlayerRef;
import com.hypixel.hytale.server.core.universe.Universe;
import com.hypixel.hytale.server.core.universe.world.World;
import io.prometheus.metrics.core.metrics.Counter;
import io.prometheus.metrics.core.metrics.Gauge;
import io.prometheus.metrics.core.metrics.Info;
import io.prometheus.metrics.model.registry.PrometheusRegistry;

import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryPoolMXBean;
import java.lang.management.MemoryUsage;
import java.lang.management.ThreadMXBean;
import java.util.*;
import java.util.logging.Logger;

/**
 * Prometheus metrics collector for Hytale server.
 * Provides comprehensive server metrics in Prometheus format.
 */
public class PrometheusMetrics {

    private static final Logger LOGGER = Logger.getLogger("KyuubiSoftAPI");
    private static PrometheusMetrics instance;

    private final PrometheusRegistry registry;
    private final TpsTracker tpsTracker;
    private final long serverStartTime;

    // Server metrics
    private final Gauge tpsCurrent;
    private final Gauge tpsAverage;
    private final Gauge tpsMin;
    private final Gauge tpsMax;
    private final Gauge tpsTarget;
    private final Gauge msptCurrent;
    private final Gauge msptAverage;

    // Player metrics
    private final Gauge playersOnline;
    private final Gauge playersMax;
    private final Gauge playersPerWorld;
    private final Counter playerJoins;
    private final Counter playerLeaves;

    // World metrics
    private final Gauge worldsLoaded;
    private final Gauge chunksLoaded;
    private final Gauge entitiesCount;

    // JVM Memory metrics
    private final Gauge memoryHeapUsed;
    private final Gauge memoryHeapMax;
    private final Gauge memoryHeapCommitted;
    private final Gauge memoryNonHeapUsed;
    private final Gauge memoryNonHeapCommitted;
    private final Gauge memoryPoolUsed;
    private final Gauge memoryPoolMax;

    // JVM GC metrics
    private final Counter gcCollectionCount;
    private final Counter gcCollectionTime;

    // JVM Thread metrics
    private final Gauge threadsCount;
    private final Gauge threadsDaemon;
    private final Gauge threadsPeak;

    // CPU metrics
    private final Gauge cpuProcess;
    private final Gauge cpuSystem;

    // Uptime
    private final Gauge uptimeSeconds;

    // Server info
    private final Info serverInfo;

    public PrometheusMetrics(TpsTracker tpsTracker) {
        instance = this;
        this.registry = new PrometheusRegistry();
        this.tpsTracker = tpsTracker;
        this.serverStartTime = System.currentTimeMillis();

        // Initialize TPS metrics
        tpsCurrent = Gauge.builder()
            .name("hytale_tps_current")
            .help("Current server TPS (ticks per second)")
            .register(registry);

        tpsAverage = Gauge.builder()
            .name("hytale_tps_average")
            .help("Average TPS over the last minute")
            .register(registry);

        tpsMin = Gauge.builder()
            .name("hytale_tps_min")
            .help("Minimum TPS over the last minute")
            .register(registry);

        tpsMax = Gauge.builder()
            .name("hytale_tps_max")
            .help("Maximum TPS over the last minute")
            .register(registry);

        tpsTarget = Gauge.builder()
            .name("hytale_tps_target")
            .help("Target TPS (usually 20)")
            .register(registry);

        msptCurrent = Gauge.builder()
            .name("hytale_mspt_current")
            .help("Current milliseconds per tick")
            .register(registry);

        msptAverage = Gauge.builder()
            .name("hytale_mspt_average")
            .help("Average milliseconds per tick over the last minute")
            .register(registry);

        // Initialize player metrics
        playersOnline = Gauge.builder()
            .name("hytale_players_online")
            .help("Number of players currently online")
            .register(registry);

        playersMax = Gauge.builder()
            .name("hytale_players_max")
            .help("Maximum number of players allowed")
            .register(registry);

        playersPerWorld = Gauge.builder()
            .name("hytale_players_world")
            .help("Number of players per world")
            .labelNames("world")
            .register(registry);

        playerJoins = Counter.builder()
            .name("hytale_player_joins_total")
            .help("Total number of player joins since server start")
            .register(registry);

        playerLeaves = Counter.builder()
            .name("hytale_player_leaves_total")
            .help("Total number of player leaves since server start")
            .register(registry);

        // Initialize world metrics
        worldsLoaded = Gauge.builder()
            .name("hytale_worlds_loaded")
            .help("Number of worlds currently loaded")
            .register(registry);

        chunksLoaded = Gauge.builder()
            .name("hytale_chunks_loaded")
            .help("Number of chunks loaded per world")
            .labelNames("world")
            .register(registry);

        entitiesCount = Gauge.builder()
            .name("hytale_entities_count")
            .help("Number of entities per world")
            .labelNames("world")
            .register(registry);

        // Initialize JVM memory metrics
        memoryHeapUsed = Gauge.builder()
            .name("jvm_memory_heap_used_bytes")
            .help("Current heap memory used in bytes")
            .register(registry);

        memoryHeapMax = Gauge.builder()
            .name("jvm_memory_heap_max_bytes")
            .help("Maximum heap memory in bytes")
            .register(registry);

        memoryHeapCommitted = Gauge.builder()
            .name("jvm_memory_heap_committed_bytes")
            .help("Committed heap memory in bytes")
            .register(registry);

        memoryNonHeapUsed = Gauge.builder()
            .name("jvm_memory_nonheap_used_bytes")
            .help("Current non-heap memory used in bytes")
            .register(registry);

        memoryNonHeapCommitted = Gauge.builder()
            .name("jvm_memory_nonheap_committed_bytes")
            .help("Committed non-heap memory in bytes")
            .register(registry);

        memoryPoolUsed = Gauge.builder()
            .name("jvm_memory_pool_used_bytes")
            .help("Memory pool usage in bytes")
            .labelNames("pool")
            .register(registry);

        memoryPoolMax = Gauge.builder()
            .name("jvm_memory_pool_max_bytes")
            .help("Memory pool maximum in bytes")
            .labelNames("pool")
            .register(registry);

        // Initialize GC metrics
        gcCollectionCount = Counter.builder()
            .name("jvm_gc_collection_count_total")
            .help("Total number of garbage collections")
            .labelNames("gc")
            .register(registry);

        gcCollectionTime = Counter.builder()
            .name("jvm_gc_collection_time_seconds_total")
            .help("Total time spent in garbage collection in seconds")
            .labelNames("gc")
            .register(registry);

        // Initialize thread metrics
        threadsCount = Gauge.builder()
            .name("jvm_threads_current")
            .help("Current number of threads")
            .register(registry);

        threadsDaemon = Gauge.builder()
            .name("jvm_threads_daemon")
            .help("Number of daemon threads")
            .register(registry);

        threadsPeak = Gauge.builder()
            .name("jvm_threads_peak")
            .help("Peak number of threads")
            .register(registry);

        // Initialize CPU metrics
        cpuProcess = Gauge.builder()
            .name("process_cpu_usage")
            .help("Process CPU usage (0-1)")
            .register(registry);

        cpuSystem = Gauge.builder()
            .name("system_cpu_usage")
            .help("System CPU usage (0-1)")
            .register(registry);

        // Uptime
        uptimeSeconds = Gauge.builder()
            .name("hytale_uptime_seconds")
            .help("Server uptime in seconds")
            .register(registry);

        // Server info
        serverInfo = Info.builder()
            .name("hytale_server")
            .help("Hytale server information")
            .register(registry);

        // Set static info
        tpsTarget.set(20.0);
        playersMax.set(100); // TODO: Get from server config

        LOGGER.info("Prometheus metrics initialized");
    }

    public static PrometheusMetrics getInstance() {
        return instance;
    }

    public PrometheusRegistry getRegistry() {
        return registry;
    }

    /**
     * Update all metrics. Called before scraping.
     */
    public void updateMetrics() {
        try {
            updateTpsMetrics();
            updatePlayerMetrics();
            updateWorldMetrics();
            updateJvmMetrics();
            updateCpuMetrics();
            updateUptime();
        } catch (Exception e) {
            LOGGER.warning("Error updating Prometheus metrics: " + e.getMessage());
        }
    }

    private void updateTpsMetrics() {
        TpsTracker.TpsSnapshot snapshot = tpsTracker.getSnapshot();
        tpsCurrent.set(snapshot.current());
        tpsAverage.set(snapshot.average());
        tpsMin.set(snapshot.min());
        tpsMax.set(snapshot.max());
        msptCurrent.set(snapshot.msptCurrent());
        msptAverage.set(snapshot.msptAverage());
    }

    private void updatePlayerMetrics() {
        try {
            Universe universe = Universe.get();
            List<PlayerRef> players = universe.getPlayers();
            playersOnline.set(players.size());

            // Count players per world
            Map<String, Integer> worldPlayerCounts = new HashMap<>();
            for (PlayerRef player : players) {
                try {
                    UUID worldUuid = player.getWorldUuid();
                    if (worldUuid != null) {
                        World world = universe.getWorld(worldUuid);
                        if (world != null) {
                            String worldName = world.getName();
                            worldPlayerCounts.merge(worldName, 1, Integer::sum);
                        }
                    }
                } catch (Exception ignored) {}
            }

            for (Map.Entry<String, Integer> entry : worldPlayerCounts.entrySet()) {
                playersPerWorld.labelValues(entry.getKey()).set(entry.getValue());
            }
        } catch (Exception e) {
            playersOnline.set(0);
        }
    }

    private void updateWorldMetrics() {
        try {
            Universe universe = Universe.get();
            Map<String, World> worlds = universe.getWorlds();
            worldsLoaded.set(worlds.size());

            // Per-world metrics
            for (World world : worlds.values()) {
                String worldName = world.getName();

                // Chunks loaded - placeholder, actual API may vary
                // chunksLoaded.labelValues(worldName).set(getWorldChunkCount(world));

                // Entities count - placeholder
                // entitiesCount.labelValues(worldName).set(getWorldEntityCount(world));
            }
        } catch (Exception e) {
            worldsLoaded.set(0);
        }
    }

    private void updateJvmMetrics() {
        // Memory metrics
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
        MemoryUsage nonHeapUsage = memoryBean.getNonHeapMemoryUsage();

        memoryHeapUsed.set(heapUsage.getUsed());
        memoryHeapMax.set(heapUsage.getMax() > 0 ? heapUsage.getMax() : heapUsage.getCommitted());
        memoryHeapCommitted.set(heapUsage.getCommitted());
        memoryNonHeapUsed.set(nonHeapUsage.getUsed());
        memoryNonHeapCommitted.set(nonHeapUsage.getCommitted());

        // Memory pools
        for (MemoryPoolMXBean pool : ManagementFactory.getMemoryPoolMXBeans()) {
            String poolName = pool.getName();
            MemoryUsage usage = pool.getUsage();
            if (usage != null) {
                memoryPoolUsed.labelValues(poolName).set(usage.getUsed());
                long max = usage.getMax();
                if (max > 0) {
                    memoryPoolMax.labelValues(poolName).set(max);
                }
            }
        }

        // GC metrics
        for (GarbageCollectorMXBean gc : ManagementFactory.getGarbageCollectorMXBeans()) {
            String gcName = gc.getName();
            long count = gc.getCollectionCount();
            long time = gc.getCollectionTime();
            if (count >= 0) {
                // Note: Counter.inc() adds to current value, but we need absolute values
                // For proper implementation, track deltas
                gcCollectionCount.labelValues(gcName).inc(0); // Initialize
            }
            if (time >= 0) {
                gcCollectionTime.labelValues(gcName).inc(0); // Initialize
            }
        }

        // Thread metrics
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        threadsCount.set(threadBean.getThreadCount());
        threadsDaemon.set(threadBean.getDaemonThreadCount());
        threadsPeak.set(threadBean.getPeakThreadCount());
    }

    private void updateCpuMetrics() {
        try {
            com.sun.management.OperatingSystemMXBean osBean =
                (com.sun.management.OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
            cpuProcess.set(osBean.getProcessCpuLoad());
            cpuSystem.set(osBean.getCpuLoad());
        } catch (Exception e) {
            cpuProcess.set(-1);
            cpuSystem.set(-1);
        }
    }

    private void updateUptime() {
        long uptime = (System.currentTimeMillis() - serverStartTime) / 1000;
        uptimeSeconds.set(uptime);
    }

    /**
     * Increment player join counter.
     */
    public void incrementPlayerJoins() {
        playerJoins.inc();
    }

    /**
     * Increment player leave counter.
     */
    public void incrementPlayerLeaves() {
        playerLeaves.inc();
    }

    /**
     * Set server info labels.
     */
    public void setServerInfo(String version, String patchline) {
        serverInfo.setLabelValues(version, patchline);
    }
}
