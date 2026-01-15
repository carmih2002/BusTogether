import { v4 as uuidv4 } from 'uuid';

/**
 * In-memory bus storage
 */
const buses = new Map();

/**
 * Create a new bus
 */
export function createBus(busData) {
    const bus = {
        id: busData.id,
        name: busData.name,
        qrUrl: `/bus/${busData.id}`,
        schedules: [],
        createdAt: new Date()
    };

    buses.set(bus.id, bus);
    return bus;
}

/**
 * Get bus by ID
 */
export function getBus(busId) {
    return buses.get(busId);
}

/**
 * Get all buses
 */
export function getAllBuses() {
    return Array.from(buses.values());
}

/**
 * Update bus
 */
export function updateBus(busId, updates) {
    const bus = buses.get(busId);
    if (!bus) {
        return null;
    }

    Object.assign(bus, updates);
    buses.set(busId, bus);
    return bus;
}

/**
 * Delete bus
 */
export function deleteBus(busId) {
    return buses.delete(busId);
}

/**
 * Check if bus exists
 */
export function busExists(busId) {
    return buses.has(busId);
}
