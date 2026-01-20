/**
 * Merchandise Gating Logic
 * 
 * Handles layer-based and attendance-locked purchase restrictions for drops.
 * 
 * Layer Hierarchy (lowest to highest):
 * - outside: Public, no mark
 * - initiate: STREETLIGHT layer (new members)
 * - member: VERIFIED/SIGNAL layer
 * - inner_circle: INNER ROOM/BLACK LABEL layer
 */

import type { User, Drop } from "../drizzle/schema";

// Layer hierarchy for comparison
const LAYER_HIERARCHY: Record<string, number> = {
  'outside': 0,
  'initiate': 1,
  'member': 2,
  'inner_circle': 3,
  'dormant': 0,     // Dormant users treated as outside
  'restricted': -1, // Restricted users can't purchase anything
  'revoked': -1,    // Revoked users can't purchase anything
};

// Map user roles to layer levels
const ROLE_TO_LAYER: Record<string, string> = {
  'public': 'outside',
  'marked_initiate': 'initiate',
  'marked_member': 'member',
  'marked_inner_circle': 'inner_circle',
  'staff': 'inner_circle',  // Staff have full access
  'admin': 'inner_circle',  // Admin have full access
};

export interface GatingResult {
  canPurchase: boolean;
  reason?: string;
  requirements?: {
    type: 'layer' | 'attendance' | 'both';
    requiredLayer?: string;
    requiredLayerLabel?: string;
    requiredEventId?: number;
    requiredEventTitle?: string;
    userLayer?: string;
    userLayerLabel?: string;
    hasAttendance?: boolean;
  };
}

/**
 * Get the user's effective layer level
 */
export function getUserLayer(user: User | null): string {
  if (!user) return 'outside';
  
  // Check if user is restricted or revoked
  if (user.status === 'revoked' || user.status === 'banned') {
    return 'revoked';
  }
  
  // Note: dormant status would need to be added to schema if needed
  // For now, we only check revoked/banned
  
  return ROLE_TO_LAYER[user.role] || 'outside';
}

/**
 * Get a human-readable label for a layer
 */
export function getLayerLabel(layer: string): string {
  const labels: Record<string, string> = {
    'outside': 'Public',
    'initiate': 'STREETLIGHT',
    'member': 'VERIFIED',
    'inner_circle': 'INNER ROOM',
    'dormant': 'Dormant',
    'restricted': 'Restricted',
    'revoked': 'Revoked',
  };
  return labels[layer] || layer;
}

/**
 * Check if user meets the layer requirement for a drop
 */
export function checkLayerAccess(user: User | null, requiredLayer: string): boolean {
  const userLayer = getUserLayer(user);
  const userLevel = LAYER_HIERARCHY[userLayer] ?? 0;
  const requiredLevel = LAYER_HIERARCHY[requiredLayer] ?? 0;
  
  // Restricted/revoked users can't access anything
  if (userLevel < 0) return false;
  
  return userLevel >= requiredLevel;
}

/**
 * Check if user has attended the required event
 */
export async function checkAttendanceAccess(
  userId: number | undefined,
  eventId: number,
  getEventPassesByUser: (userId: number) => Promise<any[]>
): Promise<boolean> {
  if (!userId) return false;
  
  const passes = await getEventPassesByUser(userId);
  
  // Check if user has a checked-in pass for this event
  return passes.some(pass => 
    pass.eventId === eventId && 
    pass.checkedInAt !== null
  );
}

/**
 * Full gating check for a drop
 */
export async function checkDropGating(
  user: User | null,
  drop: Drop,
  getEventPassesByUser: (userId: number) => Promise<any[]>,
  getEventById: (eventId: number) => Promise<any>
): Promise<GatingResult> {
  const userLayer = getUserLayer(user);
  const userLevel = LAYER_HIERARCHY[userLayer] ?? 0;
  
  // Check if user is restricted/revoked
  if (userLevel < 0) {
    return {
      canPurchase: false,
      reason: 'Your account is restricted',
      requirements: {
        type: 'layer',
        userLayer,
        userLayerLabel: getLayerLabel(userLayer),
      },
    };
  }
  
  // Check layer requirement
  const requiredLayer = drop.requiredLayer || 'outside';
  const requiredLevel = LAYER_HIERARCHY[requiredLayer] ?? 0;
  const hasLayerAccess = userLevel >= requiredLevel;
  
  // Check attendance requirement
  let hasAttendanceAccess = true;
  let requiredEvent: any = null;
  
  if (drop.attendanceLockEventId) {
    requiredEvent = await getEventById(drop.attendanceLockEventId);
    
    if (user?.id) {
      hasAttendanceAccess = await checkAttendanceAccess(
        user.id,
        drop.attendanceLockEventId,
        getEventPassesByUser
      );
    } else {
      hasAttendanceAccess = false;
    }
  }
  
  // Determine result
  const canPurchase = hasLayerAccess && hasAttendanceAccess;
  
  if (canPurchase) {
    return { canPurchase: true };
  }
  
  // Build requirements info
  const needsLayer = !hasLayerAccess;
  const needsAttendance = !hasAttendanceAccess && drop.attendanceLockEventId;
  
  let type: 'layer' | 'attendance' | 'both' = 'layer';
  if (needsLayer && needsAttendance) {
    type = 'both';
  } else if (needsAttendance) {
    type = 'attendance';
  }
  
  let reason = '';
  if (needsLayer && needsAttendance) {
    reason = `Requires ${getLayerLabel(requiredLayer)} layer and attendance at ${requiredEvent?.title || 'a specific event'}`;
  } else if (needsLayer) {
    reason = `Requires ${getLayerLabel(requiredLayer)} layer or higher`;
  } else if (needsAttendance) {
    reason = `Requires attendance at ${requiredEvent?.title || 'a specific event'}`;
  }
  
  return {
    canPurchase: false,
    reason,
    requirements: {
      type,
      requiredLayer: needsLayer ? requiredLayer : undefined,
      requiredLayerLabel: needsLayer ? getLayerLabel(requiredLayer) : undefined,
      requiredEventId: needsAttendance ? drop.attendanceLockEventId! : undefined,
      requiredEventTitle: needsAttendance ? requiredEvent?.title : undefined,
      userLayer,
      userLayerLabel: getLayerLabel(userLayer),
      hasAttendance: hasAttendanceAccess,
    },
  };
}

/**
 * Get gating info for display (without full validation)
 */
export function getDropGatingInfo(drop: Drop): {
  isLayerGated: boolean;
  isAttendanceLocked: boolean;
  requiredLayer?: string;
  requiredLayerLabel?: string;
  attendanceLockEventId?: number;
} {
  const requiredLayer = drop.requiredLayer || 'outside';
  const isLayerGated = requiredLayer !== 'outside';
  const isAttendanceLocked = !!drop.attendanceLockEventId;
  
  return {
    isLayerGated,
    isAttendanceLocked,
    requiredLayer: isLayerGated ? requiredLayer : undefined,
    requiredLayerLabel: isLayerGated ? getLayerLabel(requiredLayer) : undefined,
    attendanceLockEventId: drop.attendanceLockEventId || undefined,
  };
}
