import "server-only";
import { Resend } from "resend";
import { format } from "date-fns";
import { buildMapLinks } from "@/lib/utils/map-links";

const resend = new Resend(process.env.RESEND_API_KEY);

// Email is a convenience notification, not the source of truth (the
// in-app notifications row is written first and always exists) -- any
// failure here is logged and swallowed rather than failing the assignment
// action, per the standing rule that a flaky external call must never
// silently break the user's action.
export async function sendLoadAssignmentEmail(params: {
  to: string;
  driverName: string;
  orderNumber: string;
  pickupDate: string;
  deliveryDate: string;
  weightTons: number;
  truckRegistration: string;
  loadingNumber: string | null;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  notes: string | null;
  appUrl: string;
}) {
  const pickupLink = buildMapLinks({ address: params.pickupAddress, lat: params.pickupLat, lng: params.pickupLng });

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: params.to,
      subject: `New load assigned: ${params.orderNumber}`,
      html: `
        <p>Hi ${params.driverName},</p>
        <p><strong>New Load Assignment</strong></p>
        <p>You have been assigned a new load. Please review the details below.</p>
        <ul>
          <li>Order: ${params.orderNumber}</li>
          <li>Pickup Date: ${format(new Date(params.pickupDate), "dd MMM yyyy")}</li>
          <li>Delivery Date: ${format(new Date(params.deliveryDate), "dd MMM yyyy")}</li>
          <li>Weight: ${params.weightTons} t</li>
          <li>Truck: ${params.truckRegistration}</li>
          <li>Loading #: ${params.loadingNumber || "N/A"}</li>
          <li>Pickup: ${params.pickupAddress}</li>
          <li>Delivery: ${params.deliveryAddress}</li>
          <li>Notes: ${params.notes || "None"}</li>
        </ul>
        <p>Pickup Location: <a href="${pickupLink.googleMaps}">${pickupLink.googleMaps}</a></p>
        <p><a href="${params.appUrl}">Open Driver TMS to confirm this assignment</a></p>
      `,
    });
  } catch (error) {
    console.error("sendLoadAssignmentEmail failed", error);
  }
}
