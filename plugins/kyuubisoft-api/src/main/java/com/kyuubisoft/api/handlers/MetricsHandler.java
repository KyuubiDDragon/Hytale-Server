package com.kyuubisoft.api.handlers;

import com.kyuubisoft.api.metrics.PrometheusMetrics;
import io.prometheus.metrics.expositionformats.PrometheusTextFormatWriter;
import io.prometheus.metrics.model.registry.PrometheusRegistry;
import io.prometheus.metrics.model.snapshots.MetricSnapshots;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.logging.Logger;

/**
 * Handler for the /metrics endpoint that returns Prometheus format metrics.
 */
public class MetricsHandler {

    private static final Logger LOGGER = Logger.getLogger("KyuubiSoftAPI");
    private static final String CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8";

    private final PrometheusMetrics prometheusMetrics;
    private final PrometheusTextFormatWriter writer;

    public MetricsHandler(PrometheusMetrics prometheusMetrics) {
        this.prometheusMetrics = prometheusMetrics;
        this.writer = new PrometheusTextFormatWriter(true); // Include timestamp
    }

    /**
     * Generate Prometheus text format metrics.
     * @return Prometheus metrics as string
     */
    public String getMetrics() {
        try {
            // Update all metrics before scraping
            prometheusMetrics.updateMetrics();

            // Get the registry and scrape
            PrometheusRegistry registry = prometheusMetrics.getRegistry();
            MetricSnapshots snapshots = registry.scrape();

            // Write to Prometheus text format
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            writer.write(outputStream, snapshots);

            return outputStream.toString(StandardCharsets.UTF_8);

        } catch (IOException e) {
            LOGGER.severe("Error generating Prometheus metrics: " + e.getMessage());
            return "# Error generating metrics: " + e.getMessage() + "\n";
        }
    }

    /**
     * Get the content type for the metrics response.
     */
    public String getContentType() {
        return CONTENT_TYPE;
    }
}
